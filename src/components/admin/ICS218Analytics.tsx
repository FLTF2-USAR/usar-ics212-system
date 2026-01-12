/**
 * ICS-218 Analytics Dashboard
 * 
 * Dedicated analytics for Equipment & Vehicle Inventory (ICS-218) forms
 * Features:
 * - Total forms and vehicle tracking
 * - Category distribution
 * - Operational status monitoring
 * - Resource allocation insights
 * - Time-series trends
 * - Export capabilities
 */

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { SkeletonLoader } from '../mobile/SkeletonLoader';
import { Download, Package, AlertTriangle, TrendingUp } from 'lucide-react';

interface ICS218Form {
  id: string;
  created_at: string;
  vehicle_category?: string;
  vehicleCount: number;
}

interface ICS218Analytics {
  totalForms: number;
  totalVehicles: number;
  formsByCategory: Array<{ category: string; count: number }>;
  formsThisMonth: number;
  formsThisWeek: number;
  formsPerDay: Array<{ date: string; count: number }>;
}

export function ICS218Analytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ICS218Analytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/ics218/forms?limit=1000`
      );
      
      if (response.ok) {
        const data = await response.json();
        const forms: ICS218Form[] = data.forms || [];
        
        // Calculate analytics
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const formsThisMonth = forms.filter((f) => {
          const formDate = new Date(f.created_at);
          return formDate.getMonth() === thisMonth && formDate.getFullYear() === thisYear;
        }).length;
        
        const formsThisWeek = forms.filter((f) => {
          const formDate = new Date(f.created_at);
          return formDate >= oneWeekAgo;
        }).length;
        
        const totalVehicles = forms.reduce((sum, form) => sum + (form.vehicleCount || 0), 0);
        
        // Count by category
        const categoryCount: Record<string, number> = {};
        forms.forEach((form) => {
          const category = form.vehicle_category || 'Uncategorized';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        const formsByCategory = Object.entries(categoryCount)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);
        
        // Forms per day (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dateMap: Record<string, number> = {};
        
        forms.filter(f => new Date(f.created_at) >= thirtyDaysAgo)
          .forEach((form) => {
            const date = new Date(form.created_at).toISOString().split('T')[0];
            dateMap[date] = (dateMap[date] || 0) + 1;
          });
        
        const formsPerDay = Object.entries(dateMap)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setAnalytics({
          totalForms: forms.length,
          totalVehicles,
          formsByCategory,
          formsThisMonth,
          formsThisWeek,
          formsPerDay,
        });
      }
    } catch (error) {
      console.error('Error fetching ICS-218 analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    if (!analytics) return;
    const csv = [
      ['Metric', 'Value'],
      ['Total Forms', analytics.totalForms],
      ['Total Vehicles', analytics.totalVehicles],
      ['Forms This Month', analytics.formsThisMonth],
      ['Forms This Week', analytics.formsThisWeek],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ics218-analytics-${new Date().toISOString().split('T')[0]}.csv`;
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

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ICS-218 Analytics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Equipment & Vehicle Inventory Performance Metrics
          </p>
        </div>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-100 text-sm font-medium">Total Forms</span>
            <div className="text-2xl">📋</div>
          </div>
          <p className="text-4xl font-bold">{analytics.totalForms}</p>
          <p className="text-orange-100 text-xs mt-2">All-time submissions</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-100 text-sm font-medium">Total Vehicles</span>
            <Package className="w-6 h-6 text-red-100" />
          </div>
          <p className="text-4xl font-bold">{analytics.totalVehicles}</p>
          <p className="text-red-100 text-xs mt-2">Tracked in inventory</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-100 text-sm font-medium">This Month</span>
            <TrendingUp className="w-6 h-6 text-amber-100" />
          </div>
          <p className="text-4xl font-bold">{analytics.formsThisMonth}</p>
          <p className="text-amber-100 text-xs mt-2">Current month activity</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-100 text-sm font-medium">This Week</span>
            <div className="text-2xl">📅</div>
          </div>
          <p className="text-4xl font-bold">{analytics.formsThisWeek}</p>
          <p className="text-yellow-100 text-xs mt-2">Last 7 days</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
            Vehicle Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.formsByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.category}: ${props.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.formsByCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-500 rounded-full" />
            Inventory Activity (Last 30 Days)
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
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
            Forms by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.formsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="category" 
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
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
              <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 border border-orange-100 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          📊 Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Inventory Scale</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {analytics.totalVehicles} vehicles tracked across {analytics.totalForms} forms
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Activity Level</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {analytics.formsThisMonth} forms this month ({analytics.formsThisWeek} this week)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold text-xs">
                #1
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Top Category</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {analytics.formsByCategory[0]?.category || 'N/A'} with {analytics.formsByCategory[0]?.count || 0} forms
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
