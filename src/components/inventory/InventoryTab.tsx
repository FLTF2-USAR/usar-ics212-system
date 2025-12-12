import React, { useState } from 'react';
import { Package, ClipboardList, Lightbulb } from 'lucide-react';
import { SupplyListPanel } from './SupplyListPanel';
import { TasksPanel } from './TasksPanel';
import { SuggestionsPanel } from './SuggestionsPanel';
import { useInventory } from '../../hooks/useInventory';

type InventorySubTab = 'list' | 'tasks' | 'suggestions';

export const InventoryTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<InventorySubTab>('list');
  const { items, isLoading, error, refresh, lastFetchedAt } = useInventory();

  return (
    <div className="space-y-6">
      {/* Header with last updated info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage supply inventory, tasks, and suggested replacements
          </p>
        </div>
        {lastFetchedAt && !isLoading && (
          <div className="text-sm text-gray-500">
            Last updated: {new Date(lastFetchedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'list'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-5 h-5" />
          Inventory List
        </button>
        <button
          onClick={() => setActiveSubTab('tasks')}
          className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'tasks'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          Supply Tasks
        </button>
        <button
          onClick={() => setActiveSubTab('suggestions')}
          className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'suggestions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lightbulb className="w-5 h-5" />
          Suggestions
        </button>
      </div>

      {/* Panel Content */}
      <div className="mt-6">
        {activeSubTab === 'list' && (
          <SupplyListPanel
            items={items}
            isLoading={isLoading}
            error={error}
            onRefresh={refresh}
          />
        )}
        {activeSubTab === 'tasks' && (
          <TasksPanel />
        )}
        {activeSubTab === 'suggestions' && (
          <SuggestionsPanel />
        )}
      </div>
    </div>
  );
};