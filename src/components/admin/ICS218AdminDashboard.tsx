/**
 * ICS-218 Admin Dashboard
 * 
 * Main dashboard component for managing ICS-218 Equipment & Vehicle Inventory forms
 * Features:
 * - Mobile-first responsive design (320px+)
 * - Tab navigation (Forms, Analytics)
 * - Real-time search and filtering
 * - PDF preview and download
 * - Dark mode support
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICS218Analytics } from './ICS218Analytics';
import { ICS218FormsList } from './ICS218FormsList';
import { TouchFeedback } from '../mobile/TouchFeedback';
import { Home } from 'lucide-react';

type TabView = 'list' | 'analytics';

export function ICS218AdminDashboard() {
  const [currentView, setCurrentView] = useState<TabView>('list');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <img 
              src="/taskforce-io-logo.png" 
              alt="TASKFORCE IO" 
              className="w-10 h-10 object-contain"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                TASKFORCE IO Admin
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Equipment & Vehicle Inventory
              </p>
            </div>
            <TouchFeedback>
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                title="Return to Admin Hub"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            </TouchFeedback>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <nav className="flex border-t border-gray-200 dark:border-gray-700">
          <TouchFeedback>
            <button
              onClick={() => setCurrentView('list')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                currentView === 'list'
                  ? 'border-b-2 border-orange-600 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>📋</span>
                <span className="hidden sm:inline">Forms</span>
              </div>
            </button>
          </TouchFeedback>
          
          <TouchFeedback>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'border-b-2 border-orange-600 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>📊</span>
                <span className="hidden sm:inline">Analytics</span>
              </div>
            </button>
          </TouchFeedback>
        </nav>
      </header>
      
      {/* Content Area with padding for mobile */}
      <main className="p-4 pb-20 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {currentView === 'list' && <ICS218FormsList />}
          {currentView === 'analytics' && <ICS218Analytics />}
        </div>
      </main>
    </div>
  );
}
