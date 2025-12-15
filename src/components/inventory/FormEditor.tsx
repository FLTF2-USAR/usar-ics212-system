import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { WORKER_URL } from '../../lib/config';
import type { ChecklistData, Compartment, CompartmentItem } from '../../types';

interface FormEditorProps {
  templateId: string;
  adminPassword: string;
  onClose: () => void;
  onSaved: () => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  templateId,
  adminPassword,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ChecklistData | null>(null);
  const [templateInfo, setTemplateInfo] = useState<{name: string; apparatus: string[]}>({
    name: '',
    apparatus: [],
  });

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${WORKER_URL}/api/forms/template/${templateId}`, {
          headers: { 'X-Admin-Password': adminPassword },
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        setFormData(data.formJson);
        setTemplateInfo({ name: data.name, apparatus: data.apparatus_list });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, adminPassword]);

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/forms/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword,
        },
        body: JSON.stringify({
          formJson: formData,
          publish: true,
        }),
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const addCompartment = () => {
    if (!formData) return;
    const newComp: Compartment = {
      id: `comp_${Date.now()}`,
      title: 'New Compartment',
      items: [],
    };
    setFormData({
      ...formData,
      compartments: [...formData.compartments, newComp],
    });
  };

  const removeCompartment = (index: number) => {
    if (!formData) return;
    if (!confirm('Delete this compartment?')) return;
    setFormData({
      ...formData,
      compartments: formData.compartments.filter((_, i) => i !== index),
    });
  };

  const moveCompartment = (index: number, direction: 'up' | 'down') => {
    if (!formData) return;
    const newComps = [...formData.compartments];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newComps.length) return;
    [newComps[index], newComps[targetIndex]] = [newComps[targetIndex], newComps[index]];
    setFormData({ ...formData, compartments: newComps });
  };

  const updateCompartmentTitle = (index: number, title: string) => {
    if (!formData) return;
    const newComps = [...formData.compartments];
    newComps[index] = { ...newComps[index], title };
    setFormData({ ...formData, compartments: newComps });
  };

  const addItem = (compIndex: number) => {
    if (!formData) return;
    const newItem: CompartmentItem = {
      name: 'New Item',
      inputType: 'checkbox',
      expectedQuantity: 1,
    };
    const newComps = [...formData.compartments];
    newComps[compIndex] = {
      ...newComps[compIndex],
      items: [...newComps[compIndex].items, newItem],
    };
    setFormData({ ...formData, compartments: newComps });
  };

  const removeItem = (compIndex: number, itemIndex: number) => {
    if (!formData) return;
    const newComps = [...formData.compartments];
    newComps[compIndex] = {
      ...newComps[compIndex],
      items: newComps[compIndex].items.filter((_, i) => i !== itemIndex),
    };
    setFormData({ ...formData, compartments: newComps });
  };

  const updateItem = (compIndex: number, itemIndex: number, updates: Partial<CompartmentItem>) => {
    if (!formData) return;
    const newComps = [...formData.compartments];
    const item = newComps[compIndex].items[itemIndex];
    const currentItem = typeof item === 'string' 
      ? { name: item, inputType: 'checkbox' as const }
      : item;
    
    newComps[compIndex].items[itemIndex] = { ...currentItem, ...updates };
    setFormData({ ...formData, compartments: newComps });
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Loading...">
        <div className="p-8 text-center">Loading form template...</div>
      </Modal>
    );
  }

  if (error || !formData) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Error">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error || 'Failed to load template'}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit Template: ${templateInfo.name}`}>
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Template Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-medium text-blue-900 mb-2">Template: {templateInfo.name}</div>
          <div className="text-sm text-blue-700">
            Used by: {templateInfo.apparatus.join(', ') || 'No apparatus assigned'}
          </div>
        </div>

        {/* Form Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Form Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Compartments */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compartments</h3>
            <Button onClick={addCompartment} className="flex items-center gap-1 text-sm">
              <Plus className="w-4 h-4" />
              Add Compartment
            </Button>
          </div>

          {formData.compartments.map((comp, compIndex) => (
            <div key={comp.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={comp.title}
                  onChange={(e) => updateCompartmentTitle(compIndex, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                />
                <button
                  onClick={() => moveCompartment(compIndex, 'up')}
                  disabled={compIndex === 0}
                  className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveCompartment(compIndex, 'down')}
                  disabled={compIndex === formData.compartments.length - 1}
                  className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeCompartment(compIndex)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 ml-4">
                {comp.items.map((item, itemIndex) => {
                  const itemData = typeof item === 'string' 
                    ? { name: item, inputType: 'checkbox' as const }
                    : item;

                  return (
                    <div key={itemIndex} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                      <input
                        type="text"
                        value={itemData.name}
                        onChange={(e) => updateItem(compIndex, itemIndex, { name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Item name"
                      />
                      <select
                        value={itemData.inputType || 'checkbox'}
                        onChange={(e) => updateItem(compIndex, itemIndex, { 
                          inputType: e.target.value as CompartmentItem['inputType'] 
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="checkbox">Checkbox</option>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="percentage">Percentage</option>
                        <option value="radio">Radio</option>
                      </select>
                      <input
                        type="number"
                        value={itemData.expectedQuantity || ''}
                        onChange={(e) => updateItem(compIndex, itemIndex, { 
                          expectedQuantity: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => removeItem(compIndex, itemIndex)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <Button
                  onClick={() => addItem(compIndex)}
                  variant="secondary"
                  className="text-sm flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Item
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & Publish'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FormEditor;
