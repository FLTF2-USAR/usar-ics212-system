import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';
import { githubService } from '../lib/github';
import { formatDateTime } from '../lib/utils';
import type { Apparatus, Defect } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [fleetStatus, setFleetStatus] = useState<Map<Apparatus, number>>(new Map());
  const [defects, setDefects] = useState<Defect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [status, allDefects] = await Promise.all([
        githubService.getFleetStatus(),
        githubService.getAllDefects(),
      ]);
      setFleetStatus(status);
      setDefects(allDefects);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      alert('Error loading dashboard. Please check your GitHub token configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDefect || !resolutionNote.trim()) {
      alert('Please enter resolution notes');
      return;
    }

    setIsResolving(true);
    try {
      await githubService.resolveDefect(
        selectedDefect.issueNumber,
        resolutionNote,
        'Admin'
      );
      
      // Refresh data
      await loadDashboardData();
      
      setSelectedDefect(null);
      setResolutionNote('');
      alert('Defect resolved successfully!');
    } catch (error) {
      console.error('Error resolving defect:', error);
      alert('Error resolving defect. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const apparatusList: Apparatus[] = ['Rescue 1', 'Rescue 2', 'Rescue 3', 'Rescue 11', 'Engine 1'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">MBFD Fleet Status & Defect Management</p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Fleet Status Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fleet Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {apparatusList.map((apparatus) => {
              const defectCount = fleetStatus.get(apparatus) || 0;
              const isOk = defectCount === 0;

              return (
                <Card key={apparatus} className={isOk ? 'border-green-500' : 'border-red-500'}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Truck className={`w-8 h-8 ${isOk ? 'text-green-500' : 'text-red-500'}`} />
                      {isOk ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{apparatus}</h3>
                    <p className={`text-sm font-semibold ${isOk ? 'text-green-600' : 'text-red-600'}`}>
                      {isOk ? '✓ All Clear' : `${defectCount} Defect${defectCount !== 1 ? 's' : ''}`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Defects List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Open Defects ({defects.length})
          </h2>

          {defects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900">No Open Defects</p>
                <p className="text-gray-600 mt-1">All apparatus are fully operational</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {defects.map((defect) => (
                <Card key={defect.issueNumber} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                            {defect.apparatus}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            defect.status === 'missing'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {defect.status === 'missing' ? '❌ Missing' : '⚠️ Damaged'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {defect.compartment}: {defect.item}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Reported by {defect.reportedBy} on {formatDateTime(defect.reportedAt)}
                        </p>
                        {defect.notes && (
                          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                            {defect.notes.split('\n').slice(0, 3).join('\n')}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => setSelectedDefect(defect)}
                        variant="primary"
                        size="sm"
                        className="ml-4"
                      >
                        Resolve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!selectedDefect}
        onClose={() => {
          setSelectedDefect(null);
          setResolutionNote('');
        }}
        title="Resolve Defect"
      >
        {selectedDefect && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Apparatus</p>
              <p className="font-semibold text-gray-900">{selectedDefect.apparatus}</p>
              
              <p className="text-sm text-gray-600 mt-3 mb-1">Item</p>
              <p className="font-semibold text-gray-900">
                {selectedDefect.compartment}: {selectedDefect.item}
              </p>
              
              <p className="text-sm text-gray-600 mt-3 mb-1">Status</p>
              <p className="font-semibold text-gray-900">
                {selectedDefect.status === 'missing' ? 'Missing' : 'Damaged'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe how this was resolved (e.g., 'Replaced with spare', 'Item found and returned', 'Repaired by maintenance')"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleResolve}
                disabled={isResolving || !resolutionNote.trim()}
                className="flex-1"
              >
                {isResolving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Resolving...
                  </>
                ) : (
                  'Mark as Resolved'
                )}
              </Button>
              <Button
                onClick={() => {
                  setSelectedDefect(null);
                  setResolutionNote('');
                }}
                variant="secondary"
                className="flex-1"
                disabled={isResolving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};