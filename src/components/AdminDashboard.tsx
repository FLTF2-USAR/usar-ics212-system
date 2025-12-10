import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, AlertCircle, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';
import { githubService } from '../lib/github';
import { formatDateTime } from '../lib/utils';
import type { Defect } from '../types';

const ADMIN_PASSWORD = 'MBFDsupport!';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fleetStatus, setFleetStatus] = useState<Map<string, number>>(new Map());
  const [defects, setDefects] = useState<Defect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      githubService.setAdminPassword(ADMIN_PASSWORD);
      setIsAuthenticated(true);
      setPasswordError('');
      loadDashboardData();
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

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
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        alert('Authentication failed. Please re-enter the admin password.');
        setIsAuthenticated(false);
        githubService.clearAdminPassword();
      } else {
        alert('Error loading dashboard. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDefect || !resolutionNote.trim()) {
      alert('Please enter resolution notes');
      return;
    }

    if (!selectedDefect.issueNumber) {
      alert('Unable to resolve: Issue number not found');
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
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        alert('Authentication failed. Please re-enter the admin password.');
        setIsAuthenticated(false);
        githubService.clearAdminPassword();
      } else {
        alert('Error resolving defect. Please try again.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Access Required
              </h1>
              <p className="text-gray-600">Enter the admin password to continue</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit();
                    }
                  }}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-600 text-sm mt-2">{passwordError}</p>
                )}
              </div>

              <Button
                onClick={handlePasswordSubmit}
                className="w-full"
                size="lg"
              >
                Access Admin Dashboard
              </Button>

              <div className="text-center mt-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Only show Rescue 1 - removed other apparatus
  const apparatusList: string[] = ['Rescue 1'];

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
                <Card key={`${defect.apparatus}-${defect.item}`} className="hover:shadow-md transition-shadow">
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