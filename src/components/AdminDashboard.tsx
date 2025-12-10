import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, AlertCircle, CheckCircle, ArrowLeft, Lock, Calendar, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';
import { githubService } from '../lib/github';
import { formatDateTime } from '../lib/utils';
import { APPARATUS_LIST } from '../lib/config';
import type { Defect } from '../types';

type TabType = 'fleet' | 'activity' | 'supplies';

interface DailySubmissions {
  today: string[];
  totals: Map<string, number>;
  lastSubmission: Map<string, string>;
}

interface LowStockItem {
  item: string;
  compartment: string;
  apparatus: string[];
  occurrences: number;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('fleet');
  const [fleetStatus, setFleetStatus] = useState<Map<string, number>>(new Map());
  const [defects, setDefects] = useState<Defect[]>([]);
  const [dailySubmissions, setDailySubmissions] = useState<DailySubmissions | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [showResolveSuccess, setShowResolveSuccess] = useState(false);

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    // Set the password and try to load data
    githubService.setAdminPassword(passwordInput);
    
    try {
      await loadDashboardData();
      setIsAuthenticated(true);
      setPasswordError('');
    } catch (err) {
      console.error('Authentication failed:', err);
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setPasswordError('Network error. Please check your connection and try again.');
      } else {
        setPasswordError('Authentication failed. Please try again.');
      }
      githubService.clearAdminPassword();
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all defects
      const allDefects = await githubService.getAllDefects();
      
      // Compute fleet status from defects
      const status = githubService.computeFleetStatus(allDefects);
      
      setFleetStatus(status);
      setDefects(allDefects);
      
      // Fetch daily submissions and low stock items
      try {
        const submissions = await githubService.getDailySubmissions();
        setDailySubmissions(submissions);
      } catch (err) {
        console.error('Error fetching daily submissions:', err);
      }
      
      try {
        const lowStock = await githubService.analyzeLowStockItems();
        setLowStockItems(lowStock);
      } catch (err) {
        console.error('Error analyzing low stock:', err);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        setIsAuthenticated(false);
        githubService.clearAdminPassword();
      }
      throw error;
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
      
      // Show success toast
      setShowResolveSuccess(true);
      setTimeout(() => setShowResolveSuccess(false), 3000);
    } catch (error) {
      console.error('Error resolving defect:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        alert('Session expired. Please re-enter the admin password.');
        setIsAuthenticated(false);
        githubService.clearAdminPassword();
      } else {
        alert('Error resolving defect. Please try again.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  // Auto-refresh data every 2 minutes when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      loadDashboardData().catch(console.error);
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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

  const apparatusList: string[] = APPARATUS_LIST;
  const today = new Date().toLocaleDateString('en-US');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showResolveSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Defect resolved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">MBFD Fleet Management System</p>
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

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'fleet'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="w-5 h-5" />
              Fleet Status
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Daily Activity
            </button>
            <button
              onClick={() => setActiveTab('supplies')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'supplies'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-5 h-5" />
              Supply Alerts
              {lowStockItems.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {lowStockItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Fleet Status Tab */}
        {activeTab === 'fleet' && (
          <>
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
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                            className="mt-3 md:mt-0 md:ml-4"
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
          </>
        )}

        {/* Daily Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Daily Activity - {today}
              </h2>

              {/* Today's Submissions */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Submissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {apparatusList.map((apparatus) => {
                      const hasSubmitted = dailySubmissions?.today.includes(apparatus) || false;
                      return (
                        <div
                          key={apparatus}
                          className={`p-4 rounded-lg border-2 ${
                            hasSubmitted
                              ? 'bg-green-50 border-green-500'
                              : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Truck className={`w-6 h-6 ${hasSubmitted ? 'text-green-600' : 'text-gray-400'}`} />
                            {hasSubmitted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <p className="font-bold text-gray-900">{apparatus}</p>
                          <p className={`text-sm font-semibold ${hasSubmitted ? 'text-green-600' : 'text-gray-500'}`}>
                            {hasSubmitted ? '✓ Submitted' : 'Pending'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Submission Statistics */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Submission Statistics (Last 30 Days)
                  </h3>
                  <div className="space-y-3">
                    {apparatusList.map((apparatus) => {
                      const total = dailySubmissions?.totals.get(apparatus) || 0;
                      const lastDate = dailySubmissions?.lastSubmission.get(apparatus);
                      const percentage = Math.round((total / 30) * 100);
                      
                      return (
                        <div key={apparatus} className="border-b border-gray-200 pb-3 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Truck className="w-5 h-5 text-blue-600" />
                              <span className="font-semibold text-gray-900">{apparatus}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-blue-600">{total}</span>
                              <span className="text-sm text-gray-600 ml-1">submissions</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{percentage}% compliance rate</span>
                            {lastDate && <span>Last: {lastDate}</span>}
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Supply Alerts Tab */}
        {activeTab === 'supplies' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Supply Alerts
            </h2>

            {lowStockItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900">No Supply Concerns</p>
                  <p className="text-gray-600 mt-1">All items are adequately stocked</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> Items listed below have been reported missing multiple times across different apparatus in the last 30 days. 
                    This may indicate a supply shortage requiring attention.
                  </p>
                </div>

                {lowStockItems.map((item, index) => (
                  <Card key={index} className="border-orange-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                            <h3 className="text-lg font-bold text-gray-900">
                              {item.compartment}: {item.item}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700">
                              <strong>Reported missing {item.occurrences} time{item.occurrences !== 1 ? 's' : ''}</strong> in the last 30 days
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-700">Affected apparatus:</span>
                              {item.apparatus.map((apparatus) => (
                                <span
                                  key={apparatus}
                                  className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold"
                                >
                                  {apparatus}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
                            <span className="text-xl font-bold text-orange-600">{item.occurrences}</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
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