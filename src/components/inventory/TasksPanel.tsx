import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Package, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useSupplyTasks } from '../../hooks/useSupplyTasks';
import { formatDateTime } from '../../lib/utils';

type TaskStatus = 'pending' | 'completed' | 'canceled';

export const TasksPanel: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<TaskStatus>('pending');
  const { tasks, isLoading, error, completeTask, cancelTask, refresh } = useSupplyTasks(activeStatus);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  const handleComplete = async (taskId: string, itemName: string) => {
    if (!confirm(`Mark "${itemName}" task as completed?`)) return;

    setProcessingTaskId(taskId);
    try {
      await completeTask(taskId, undefined, 'Admin', 'Completed from dashboard');
      alert('Task marked as completed successfully');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to complete task'}`);
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleCancel = async (taskId: string, itemName: string) => {
    const notes = prompt(`Cancel "${itemName}" task? Enter reason (optional):`);
    if (notes === null) return; // User clicked cancel

    setProcessingTaskId(taskId);
    try {
      await cancelTask(taskId, notes || 'Canceled from dashboard');
      alert('Task canceled successfully');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to cancel task'}`);
    } finally {
      setProcessingTaskId(null);
    }
  };

 if (error) {
    return (
      <Card className="border-red-300">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Tasks</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <Button onClick={refresh} variant="secondary">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveStatus('pending')}
          className={`px-4 py-3 font-semibold transition-all flex items-center gap-2 whitespace-nowrap min-w-[120px] ${
            activeStatus === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-5 h-5" />
          Pending
        </button>
        <button
          onClick={() => setActiveStatus('completed')}
          className={`px-4 py-3 font-semibold transition-all flex items-center gap-2 whitespace-nowrap min-w-[120px] ${
            activeStatus === 'completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          Completed
        </button>
        <button
          onClick={() => setActiveStatus('canceled')}
          className={`px-4 py-3 font-semibold transition-all flex items-center gap-2 whitespace-nowrap min-w-[120px] ${
            activeStatus === 'canceled'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <XCircle className="w-5 h-5" />
          Canceled
        </button>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">No {activeStatus} tasks</p>
            <p className="text-gray-600 mt-1">
              {activeStatus === 'pending'
                ? 'All supply tasks are up to date'
                : `No tasks have been ${activeStatus}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {task.apparatus}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          task.deficiencyType === 'missing'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.deficiencyType === 'missing' ? '❌ Missing' : '⚠️ Damaged'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {task.itemName}
                      </h3>
                      {task.compartment && (
                        <p className="text-sm text-gray-600">
                          Compartment: {task.compartment}
                        </p>
                      )}
                    </div>
                    {activeStatus === 'pending' && (
                      <div className="flex-shrink-0">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    )}
                    {activeStatus === 'completed' && (
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    {activeStatus === 'canceled' && (
                      <div className="flex-shrink-0">
                        <XCircle className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">
                      <span className="font-semibold">Created by:</span> {task.createdBy}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Created:</span> {formatDateTime(task.createdAt)}
                    </p>
                    {task.completedBy && task.completedAt && (
                      <>
                        <p className="text-gray-600">
                          <span className="font-semibold">Completed by:</span> {task.completedBy}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold">Completed:</span> {formatDateTime(task.completedAt)}
                        </p>
                      </>
                    )}
                    {task.notes && (
                      <p className="text-gray-700 bg-gray-50 p-2 rounded mt-2">
                        <span className="font-semibold">Notes:</span> {task.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions for Pending Tasks */}
                  {activeStatus === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleComplete(task.id, task.itemName)}
                        variant="primary"
                        size="sm"
                        className="flex-1 min-h-[44px]"
                        disabled={processingTaskId === task.id}
                      >
                        {processingTaskId === task.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleCancel(task.id, task.itemName)}
                        variant="secondary"
                        size="sm"
                        className="flex-1 min-h-[44px] bg-red-50 hover:bg-red-100 text-red-700"
                        disabled={processingTaskId === task.id}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && tasks.length > 0 && (
        <div className="text-center text-sm text-gray-600 py-2">
          {tasks.length} {activeStatus} task{tasks.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};