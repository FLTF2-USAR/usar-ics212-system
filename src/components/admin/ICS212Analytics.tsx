/**
 * ICS-212 Analytics Dashboard
 * 
 * Dedicated analytics for Vehicle Safety Inspection (ICS-212) forms
 * Features:
 * - Key performance indicators
 * - Hold/Release trends
 * - Top vehicles by inspection frequency
 * - Safety item failure analysis
 * - Time-series visualization
 * - Export capabilities
 */

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend 
} from 'recharts';
import { SkeletonLoader } from '../mobile/SkeletonLoader';
import { Download, TrendingUp, AlertTriangle } from 'lucide-react';

interface ICS212AnalyticsData {
  totalForms: number;
  formsThisMonth: number;
  formsThisWeek: number;
  holdRate: number;
  releaseRate: number;
  topVehicles: Array<{ vehicleId: string; count: number }>;
  safetyItemFailures: Array<{ item: string; count: number }>;
  formsPerDay: Array<{ date: string; count: number }>;
}

export function ICS212Analytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ICS212AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/ics212/analytics`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching ICS-212 analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    if (!analytics) return;
    // Create CSV export
    const csv = [
      ['Metric', 'Value'],
      ['Total Forms', analytics.totalForms],
      ['Forms This Month', analytics.formsThisMonth],
      ['Hold Rate (%)', analytics.holdRate.toFixed(2)],
      ['Release Rate (%)', analytics.releaseRate.toFixed(2)],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ics212-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} type="card" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
        <p className="text-red-800 dark:text-red-200 font-semibold">Failed to load analytics data</p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  const pieData = [
    { name: 'HOLD', value: Math.round(analytics.holdRate), color: '#ef4444' },
    { name: 'RELEASED', value: Math.round(analytics.releaseRate), color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ICS-212 Analytics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vehicle Safety Inspection Performance Metrics
          </p>
        </div>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm font-medium">Total Forms</span>
            <div className="text-2xl">📋</div>
          </div>
          <p className="text-4xl font-bold">{analytics.totalForms}</p>
          <p className="text-blue-100 text-xs mt-2">All-time submissions</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100 text-sm font-medium">This Month</span>
            <TrendingUp className="w-6 h-6 text-green-100" />
          </div>
          <p className="text-4xl font-bold">{analytics.formsThisMonth}</p>
          <p className="text-green-100 text-xs mt-2">Current month activity</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-100 text-sm font-medium">Hold Rate</span>
            <div className="text-2xl">🔴</div>
          </div>
          <p className="text-4xl font-bold">{analytics.holdRate.toFixed(1)}%</p>
          <p className="text-red-100 text-xs mt-2">Vehicles held for safety</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-100 text-sm font-medium">Release Rate</span>
            <div className="text-2xl">✅</div>
          </div>
          <p className="text-4xl font-bold">{analytics.releaseRate.toFixed(1)}%</p>
          <p className="text-emerald-100 text-xs mt-2">Approved for operation</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Release Decision Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            Release Decision Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Forms Per Day Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
            Inspection Activity (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.formsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px' 
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 Vehicles by Inspection Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            Top 10 Inspected Vehicles
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topVehicles.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="vehicleId" 
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={90}
                tick={{ fontSize: 10 }}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px' 
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Safety Item Failures */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
            Top Safety Item Failures
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.safetyItemFailures.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis 
                type="category" 
                dataKey="item" 
                stroke="#9ca3af"
                width={140}
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px' 
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          📊 Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Activity Trend</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {analytics.formsThisMonth} inspections completed this month
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Safety Focus</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {analytics.safetyItemFailures[0]?.item || 'N/A'} is the most common failure
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="w-5 h-5 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Pass Rate</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {analytics.releaseRate.toFixed(1)}% of vehicles released
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
