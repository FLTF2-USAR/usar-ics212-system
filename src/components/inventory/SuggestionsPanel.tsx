import React from 'react';
import { Lightbulb, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { useSupplyTasks } from '../../hooks/useSupplyTasks';
import { useInventory } from '../../hooks/useInventory';
import type { SuggestedReplacement } from '../../lib/inventory';

export const SuggestionsPanel: React.FC = () => {
  const { tasks, isLoading: tasksLoading } = useSupplyTasks('pending');
  const { items, isLoading: inventoryLoading } = useInventory();

  const isLoading = tasksLoading || inventoryLoading;

  // Match tasks with inventory using fuzzy matching
  const tasksWithSuggestions = React.useMemo(() => {
    return tasks.map((task) => {
      const suggestions: Array<SuggestedReplacement & { inStock: boolean }> = [];

      // If task already has suggested replacements, use those
      if (task.suggestedReplacements && task.suggestedReplacements.length > 0) {
        return {
          task,
          suggestions: task.suggestedReplacements.map(s => ({
            ...s,
            inStock: s.qtyOnHand > 0,
          })),
        };
      }

      // Otherwise, do simple fuzzy matching
      const searchTerm = task.itemName.toLowerCase();
      
      items.forEach((item) => {
        const itemName = item.equipmentName.toLowerCase();
        const itemType = item.equipmentType.toLowerCase();
        
        // Score based on name similarity
        let confidence = 0;
        if (itemName.includes(searchTerm) || searchTerm.includes(itemName)) {
          confidence = 0.8;
        } else if (itemType.includes(searchTerm) || searchTerm.includes(itemType)) {
          confidence = 0.6;
        }

        if (confidence > 0) {
          suggestions.push({
            itemId: item.id,
            itemName: item.equipmentName,
            qtyOnHand: item.quantity,
            location: item.location,
            confidence,
            inStock: item.quantity > 0,
          });
        }
      });

      // Sort by confidence and stock availability
      suggestions.sort((a, b) => {
        if (a.inStock && !b.inStock) return -1;
        if (!a.inStock && b.inStock) return 1;
        return (b.confidence || 0) - (a.confidence || 0);
      });

      return { task, suggestions: suggestions.slice(0, 3) }; // Top 3 suggestions
    });
  }, [tasks, items]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading suggestions...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">No Pending Tasks</p>
          <p className="text-gray-600 mt-1">
            Suggestions will appear when there are pending supply tasks
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-semibold">Inventory Suggestions</p>
            <p className="text-sm text-blue-800 mt-1">
              Suggested replacements from inventory for pending tasks. Match confidence and stock availability shown.
            </p>
          </div>
        </div>
      </div>

      {tasksWithSuggestions.map(({ task, suggestions }) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Task Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {task.apparatus}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    task.deficiencyType === 'missing'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.deficiencyType === 'missing' ? 'Missing' : 'Damaged'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">
                  {task.itemName}
                </h3>
                {task.compartment && (
                  <p className="text-sm text-gray-600">Compartment: {task.compartment}</p>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length === 0 ? (
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No matching items found in inventory</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Suggested Replacements:</p>
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={`${suggestion.itemId}-${idx}`}
                      className={`p-3 rounded-lg border-2 ${
                        suggestion.inStock
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className={`w-4 h-4 ${suggestion.inStock ? 'text-green-600' : 'text-gray-400'}`} />
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {suggestion.itemName}
                            </h4>
                          </div>
                          {suggestion.location && (
                            <p className="text-xs text-gray-600">
                              Location: {suggestion.location}
                            </p>
                          )}
                          {suggestion.confidence && (
                            <p className="text-xs text-gray-500 mt-1">
                              Match: {Math.round(suggestion.confidence * 100)}%
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-2xl font-bold ${
                            suggestion.inStock ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {suggestion.qtyOnHand}
                          </div>
                          <div className={`text-xs font-semibold ${
                            suggestion.inStock ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {suggestion.inStock ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                IN STOCK
                              </span>
                            ) : (
                              'OUT OF STOCK'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Note about completing with replacement */}
              {suggestions.some(s => s.inStock) && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-900">
                    💡 <strong>Tip:</strong> When marking this task as complete in the Tasks tab, 
                    you can select one of these items as the replacement to automatically update inventory.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <div className="text-center text-sm text-gray-600 py-2">
        {tasksWithSuggestions.length} task{tasksWithSuggestions.length !== 1 ? 's' : ''} with suggestions
      </div>
    </div>
  );
};