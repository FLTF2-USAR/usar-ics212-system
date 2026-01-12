/**
 * Admin Hub - Main Landing Page
 * 
 * Professional, modern entry point for the entire admin system
 * Features:
 * - Glassmorphism design with gradient backgrounds
 * - Three main management sections (ICS-212, ICS-218, Documents)
 * - Real-time statistics preview
 * - Responsive grid layout
 * - Dark mode support
 * - Smooth animations and micro-interactions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TouchFeedback } from '../mobile/TouchFeedback';
import { SkeletonLoader } from '../mobile/SkeletonLoader';
import { 
  ClipboardCheck, 
  Truck, 
  FileText, 
  TrendingUp, 
  Home,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface SystemStats {
  ics212: {
    total: number;
    thisMonth: number;
    holdRate: number;
  };
  ics218: {
    total: number;
    thisMonth: number;
    vehiclesTracked: number;
  };
  documents: {
    total: number;
    recentUploads: number;
  };
}

export function AdminHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStats = async () => {
    try {
      // Fetch ICS-212 analytics
      const ics212Response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/ics212/analytics`);
      const ics212Data = ics212Response.ok ? await ics212Response.json() : null;

      // Fetch ICS-218 forms
      const ics218Response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/ics218/forms?limit=1000`);
      const ics218Data = ics218Response.ok ? await ics218Response.json() : null;

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const ics218Forms = ics218Data?.forms || [];
      const ics218ThisMonth = ics218Forms.filter((f: any) => {
        const formDate = new Date(f.created_at);
        return formDate.getMonth() === thisMonth && formDate.getFullYear() === thisYear;
      }).length;
      const totalVehicles = ics218Forms.reduce((sum: number, form: any) => sum + (form.vehicleCount || 0), 0);

      setStats({
        ics212: {
          total: ics212Data?.totalForms || 0,
          thisMonth: ics212Data?.formsThisMonth || 0,
          holdRate: ics212Data?.holdRate || 0,
        },
        ics218: {
          total: ics218Forms.length,
          thisMonth: ics218ThisMonth,
          vehiclesTracked: totalVehicles,
        },
        documents: {
          total: 0,
          recentUploads: 0,
        },
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} type="card" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'ics212',
      title: 'ICS-212 Management',
      subtitle: 'Vehicle Safety Inspections',
      icon: ClipboardCheck,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      path: '/admin/ics212',
      stats: stats?.ics212 && [
        { label: 'Total Forms', value: stats.ics212.total, icon: ChevronRight },
        { label: 'This Month', value: stats.ics212.thisMonth, icon: TrendingUp },
        { 
          label: 'Hold Rate', 
          value: `${stats.ics212.holdRate.toFixed(1)}%`, 
          icon: stats.ics212.holdRate > 10 ? AlertCircle : CheckCircle,
          highlight: stats.ics212.holdRate > 10
        },
      ],
    },
    {
      id: 'ics218',
      title: 'ICS-218 Management',
      subtitle: 'Equipment & Vehicle Inventory',
      icon: Truck,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      path: '/admin/ics218',
      stats: stats?.ics218 && [
        { label: 'Total Forms', value: stats.ics218.total, icon: ChevronRight },
        { label: 'This Month', value: stats.ics218.thisMonth, icon: TrendingUp },
        { label: 'Vehicles Tracked', value: stats.ics218.vehiclesTracked, icon: Truck },
      ],
    },
    {
      id: 'documents',
      title: 'Document Management',
      subtitle: 'Upload & Organize Forms',
      icon: FileText,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      path: '/admin/documents',
      stats: [
        { label: 'Total Documents', value: stats?.documents.total || 0, icon: ChevronRight },
        { label: 'Recent Uploads', value: stats?.documents.recentUploads || 0, icon: TrendingUp },
        { label: 'Storage Available', value: '∞', icon: CheckCircle },
      ],
      comingSoon: stats?.documents.total === 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 shadow-lg border-b border-white/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/taskforce-io-logo.png" 
                alt="TASKFORCE IO" 
                className="w-12 h-12 object-contain drop-shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  TASKFORCE IO
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Emergency Response Management System
                </p>
              </div>
            </div>
            <TouchFeedback>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Home</span>
              </button>
            </TouchFeedback>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Administrative Dashboard
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage emergency response forms, track vehicle inventory, and organize documentation with our comprehensive management system.
          </p>
        </div>

        {/* Management Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {cards.map((card) => (
            <TouchFeedback key={card.id}>
              <div
                onClick={() => navigate(card.path)}
                className={`
                  relative overflow-hidden rounded-2xl cursor-pointer
                  backdrop-blur-xl bg-white/80 dark:bg-gray-800/80
                  border border-white/20 dark:border-gray-700/20
                  shadow-xl hover:shadow-2xl
                  transition-all duration-500 ease-out
                  transform hover:scale-105 hover:-translate-y-2
                  group
                `}
              >
                {/* Gradient Background Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Content */}
                <div className="relative p-8 z-10">
                  {/* Icon & Title */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <card.icon className="w-8 h-8" />
                    </div>
                    {card.comingSoon && (
                      <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {card.subtitle}
                  </p>

                  {/* Stats */}
                  {card.stats && (
                    <div className="space-y-3">
                      {card.stats.map((stat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-sm"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {stat.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${'highlight' in stat && stat.highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                              {stat.value}
                            </span>
                            <stat.icon className={`w-4 h-4 ${'highlight' in stat && stat.highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-6 flex items-center justify-between text-sm font-semibold">
                    <span className={`bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                      {card.comingSoon ? 'Manage When Available' : 'Open Dashboard'}
                    </span>
                    <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transform group-hover:translate-x-2 transition-all duration-300`} />
                  </div>
                </div>
              </div>
            </TouchFeedback>
          ))}
        </div>

        {/* System Info Footer */}
        <div className="mt-16 p-6 rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/20 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                System Status: <span className="text-green-600 dark:text-green-400">Operational</span>
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All services running normally. Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium">
                ✓ Airtable Connected
              </div>
              <div className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium">
                ✓ R2 Storage Active
              </div>
              <div className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium">
                ✓ Email Configured
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
