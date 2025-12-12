import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import type { InventoryItem, SupplyTask, AIInsight, AIInsightData } from '../../lib/inventory';
import { generateAIInsights, fetchAIInsights } from '../../lib/inventory';

interface AIInsightsPanelProps {
  inventory: InventoryItem[];
  tasks: SupplyTask[];
}

export function AIInsightsPanel({ inventory, tasks }: AIInsightsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiNotConfigured, setAiNotConfigured] = useState(false);

  // Load latest insights on mount
  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setIsLoadingInsights(true);
    setError(null);
    try {
      const result = await fetchAIInsights();
      setInsights(result.insights);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setIsLoadingInsights(false);
    }
  }

  async function handleGenerateInsights() {
    setIsGenerating(true);
    setError(null);
    setAiNotConfigured(false);
    
    try {
      const result = await generateAIInsights({
        tasks: tasks.filter(t => t.status === 'pending'),
        inventory,
      });
      
      if (!result.ok) {
        setAiNotConfigured(true);
        setError(result.message);
      } else {
        // Wait a moment then reload insights
        setTimeout(() => {
          loadInsights();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  }

  function parseInsightData(insightJson: string): AIInsightData | null {
    try {
      return JSON.parse(insightJson) as AIInsightData;
    } catch {
      return null;
    }
  }

  const latestInsight = insights.length > 0 ? insights[0] : null;
  const parsedInsight = latestInsight ? parseInsightData(latestInsight.insight_json) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Insights</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automated inventory analysis and recommendations
          </p>
        </div>
        <Button
          onClick={handleGenerateInsights}
          disabled={isGenerating || inventory.length === 0}
          className="min-h-[44px] whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin mr-2">⚙️</span>
              Generating...
            </>
          ) : (
            '🤖 Generate Insights'
          )}
        </Button>
      </div>

      {/* Error/Warning Messages */}
      {error && (
        <div
          className={`p-4 rounded-lg ${
            aiNotConfigured
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`text-sm ${
              aiNotConfigured ? 'text-yellow-800' : 'text-red-800'
            }`}
          >
            {aiNotConfigured ? (
              <>
                <strong>⚠️ AI Not Configured:</strong> {error}
                <br />
                <span className="text-xs mt-1 block">
                  This is an optional feature. The system works fully without it.
                </span>
              </>
            ) : (
              <><strong>Error:</strong> {error}</>
            )}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingInsights && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin text-4xl">⚙️</div>
          <p className="text-gray-600 mt-2">Loading insights...</p>
        </div>
      )}

      {/* Latest Insight Display */}
      {!isLoadingInsights && latestInsight && parsedInsight && (
        <div className="space-y-4">
          {/* Timestamp */}
          <div className="text-sm text-gray-500">
            Generated: {new Date(latestInsight.created_at).toLocaleString()}
            {latestInsight.model && (
              <span className="ml-2">• Model: {latestInsight.model.split('/').pop()}</span>
            )}
          </div>

          {/* Summary */}
          {parsedInsight.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Summary</h3>
              <p className="text-blue-800 text-sm">{parsedInsight.summary}</p>
            </div>
          )}

          {/* Recurring Issues */}
          {parsedInsight.recurringIssues && parsedInsight.recurringIssues.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">🔄 Recurring Issues</h3>
              <ul className="space-y-1">
                {parsedInsight.recurringIssues.map((issue, idx) => (
                  <li key={idx} className="text-orange-800 text-sm">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reorder Suggestions */}
          {parsedInsight.reorderSuggestions && parsedInsight.reorderSuggestions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">📦 Reorder Suggestions</h3>
              <div className="space-y-3">
                {parsedInsight.reorderSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white rounded p-3 border border-green-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-green-900 text-sm">{suggestion.item}</p>
                        <p className="text-green-700 text-xs mt-1">{suggestion.reason}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          suggestion.urgency?.toLowerCase() === 'high'
                            ? 'bg-red-100 text-red-800'
                            : suggestion.urgency?.toLowerCase() === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {suggestion.urgency || 'Normal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {parsedInsight.anomalies && parsedInsight.anomalies.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">🔍 Anomalies Detected</h3>
              <ul className="space-y-1">
                {parsedInsight.anomalies.map((anomaly, idx) => (
                  <li key={idx} className="text-purple-800 text-sm">
                    • {anomaly}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingInsights && insights.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-gray-600 font-medium">No insights generated yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Click "Generate Insights" to analyze your inventory
          </p>
        </div>
      )}

      {/* Insight History Count */}
      {insights.length > 1 && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
          {insights.length} insights stored • Showing most recent
        </div>
      )}
    </div>
  );
}