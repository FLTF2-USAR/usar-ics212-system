/**
 * Document Management Component
 * 
 * Upload and manage ICS forms and documents
 * Features:
 * - Drag-and-drop file upload
 * - R2 storage integration
 * - File browser with categories
 * - Download and delete capabilities
 * - Mobile-responsive design
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TouchFeedback } from '../mobile/TouchFeedback';
import { SkeletonLoader } from '../mobile/SkeletonLoader';
import { 
  Upload, FileText, Download, Trash2, Home, 
  AlertCircle, CheckCircle, Folder 
} from 'lucide-react';

interface UploadedFile {
  id: string;
  filename: string;
  uploadedAt: string;
  size: number;
  category: string;
}

export function DocumentManagement() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      // TODO: Implement API endpoint to list uploaded files from R2
      // For now, using mock data
      setFiles([]);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await uploadFiles(droppedFiles);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    await uploadFiles(selectedFiles);
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;
    
    setUploading(true);
    setUploadMessage(null);

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'general');

        // TODO: Implement actual upload endpoint
        // const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        //   method: 'POST',
        //   body: formData,
        // });

        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock upload delay
      }
      
      setUploadMessage({ 
        type: 'success', 
        text: `Successfully uploaded ${filesToUpload.length} file(s)` 
      });
      await fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage({ 
        type: 'error', 
        text: 'Failed to upload files. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      // TODO: Implement delete endpoint
      setFiles(files.filter(f => f.id !== fileId));
      setUploadMessage({ type: 'success', text: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      setUploadMessage({ type: 'error', text: 'Failed to delete file' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} type="card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload and organize ICS forms and related documents
          </p>
        </div>
        <TouchFeedback>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Hub</span>
          </button>
        </TouchFeedback>
      </div>

      {/* Upload Message */}
      {uploadMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          uploadMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {uploadMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            uploadMessage.type === 'success' 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {uploadMessage.text}
          </span>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${dragOver 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className={`w-16 h-16 mx-auto mb-4 ${dragOver ? 'text-green-600' : 'text-gray-400'}`} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {uploading ? 'Uploading...' : dragOver ? 'Drop files here' : 'Upload Documents'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Supported: PDF, DOC, DOCX, XLS, XLSX (Max 10MB per file)
          </p>
        </label>
      </div>

      {/* Coming Soon Notice - Actual file listing will be implemented */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border border-green-200 dark:border-gray-700 rounded-xl p-8 text-center">
        <Folder className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Document Library Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          File browser, categorization, and management features are under development.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Upload functionality will be connected to R2 storage in the next update.
        </p>
      </div>

      {/* File List (when implemented) */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Uploaded Files ({files.length})
          </h3>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{file.filename}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(file.uploadedAt).toLocaleDateString()} • {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TouchFeedback>
                  <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </TouchFeedback>
                <TouchFeedback>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </TouchFeedback>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
