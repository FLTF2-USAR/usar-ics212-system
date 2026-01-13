import { useState, useEffect, useRef } from 'react';
import { Save, RotateCcw, Move, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { Document, Page, pdfjs } from 'react-pdf';
import { showToast } from '../mobile/Toast';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// PDF Constants - Letter size 8.5" x 11" @ 72 DPI
const PDF_WIDTH = 612;
const PDF_HEIGHT = 792;

interface FieldConfig {
  field_key: string;
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
  field_type: string;
  label: string;
}

interface PdfMapperProps {
  formType?: string;
  apiPassword: string;
}

export function PdfMapper({ formType = 'ics212', apiPassword }: PdfMapperProps) {
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Fetch existing field configurations
  useEffect(() => {
    fetchFieldConfigs();
  }, [formType]);

  // Update container dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const fetchFieldConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pdf-config/${formType}`, {
        headers: {
          'X-Admin-Password': apiPassword,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch field configurations');
      }

      const data = await response.json();
      
      // Convert to FieldConfig format with labels
      const configsWithLabels = data.configs.map((config: any) => ({
        ...config,
        label: formatFieldLabel(config.field_key),
      }));

      setFields(configsWithLabels);
    } catch (error) {
      console.error('Error fetching field configs:', error);
      showToast({
        message: 'Failed to load field configurations',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format field key to human-readable label
  const formatFieldLabel = (fieldKey: string): string => {
    return fieldKey
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle field drag stop - convert pixel position to percentage
  const handleDragStop = (fieldKey: string, d: any) => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const x_pct = d.x / containerWidth;
    const y_pct = d.y / containerHeight;

    setFields((prevFields) =>
      prevFields.map((field) =>
        field.field_key === fieldKey
          ? { ...field, x_pct, y_pct }
          : field
      )
    );
  };

  // Handle field resize stop - convert pixel dimensions to percentage
  const handleResizeStop = (
    fieldKey: string,
    ref: HTMLElement,
    position: { x: number; y: number }
  ) => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const width_pct = ref.offsetWidth / containerWidth;
    const height_pct = ref.offsetHeight / containerHeight;
    const x_pct = position.x / containerWidth;
    const y_pct = position.y / containerHeight;

    setFields((prevFields) =>
      prevFields.map((field) =>
        field.field_key === fieldKey
          ? { ...field, x_pct, y_pct, width_pct, height_pct }
          : field
      )
    );
  };

  // Save all field configurations to API
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/pdf-config/${formType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': apiPassword,
        },
        body: JSON.stringify({ configs: fields }),
      });

      if (!response.ok) {
        throw new Error('Failed to save field configurations');
      }

      showToast({
        message: 'Field configurations saved successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving field configs:', error);
      showToast({
        message: 'Failed to save field configurations',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default configurations
  const handleReset = async () => {
    if (!confirm('Reset all fields to default positions? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pdf-config/${formType}/reset`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': apiPassword,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset field configurations');
      }

      showToast({
        message: 'Field configurations reset to defaults',
        type: 'success',
      });

      // Reload configurations
      await fetchFieldConfigs();
    } catch (error) {
      console.error('Error resetting field configs:', error);
      showToast({
        message: 'Failed to reset field configurations',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading PDF Mapper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              PDF Field Mapper
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Drag and resize fields to align with the PDF template. Changes are saved to the database.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Layout
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">How to use:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Drag field boxes to position them over the PDF template</li>
              <li>Resize boxes by dragging the corners to match field size</li>
              <li>Click "Save Layout" to persist changes to the database</li>
              <li>Changes will apply to all future PDF generations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PDF Mapper Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div
          ref={containerRef}
          className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
          style={{ height: '800px' }}
        >
          {/* PDF Template - Placeholder since template is in R2 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Document
              file="/templates/ics_212_template.pdf"
              loading={
                <div className="text-gray-500">Loading PDF template...</div>
              }
              error={
                <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="mx-auto mb-2 text-yellow-600" size={32} />
                  <p className="text-yellow-900 dark:text-yellow-100">
                    PDF template not found. Upload template to R2 bucket first.
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    Expected location: R2 'usar-forms' bucket, key 'templates/ics_212_template.pdf'
                  </p>
                </div>
              }
            >
              <Page
                pageNumber={1}
                width={containerDimensions.width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>

          {/* Draggable Field Overlays */}
          {fields.map((field) => {
            const x = field.x_pct * (containerDimensions.width || PDF_WIDTH);
            const y = field.y_pct * (containerDimensions.height || PDF_HEIGHT);
            const width = field.width_pct * (containerDimensions.width || PDF_WIDTH);
            const height = field.height_pct * (containerDimensions.height || PDF_HEIGHT);

            return (
              <Rnd
                key={field.field_key}
                position={{ x, y }}
                size={{ width, height }}
                onDragStop={(_e, d) => handleDragStop(field.field_key, d)}
                onResizeStop={(_e, _direction, ref, _delta, position) =>
                  handleResizeStop(field.field_key, ref, position)
                }
                bounds="parent"
                className={`border-2 ${
                  selectedField === field.field_key
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-red-500 bg-red-500/10'
                } cursor-move hover:bg-red-500/20 transition-colors`}
                onClick={() => setSelectedField(field.field_key)}
              >
                <div className="flex items-center justify-center h-full px-2 text-xs font-semibold text-gray-900 dark:text-white pointer-events-none">
                  <Move size={12} className="mr-1" />
                  {field.label}
                </div>
              </Rnd>
            );
          })}
        </div>

        {/* Field List */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {fields.map((field) => (
            <button
              key={field.field_key}
              onClick={() => setSelectedField(field.field_key)}
              className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                selectedField === field.field_key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {field.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CheckCircle2 size={16} className="text-green-600" />
          <span>
            {fields.length} fields configured | Selected: {selectedField || 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}
