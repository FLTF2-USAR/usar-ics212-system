import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent } from './ui/Card';
import { InspectionCard } from './InspectionCard';
import { githubService } from '../lib/github';
import type { User, ChecklistData, ChecklistItem, GitHubIssue, ItemStatus } from '../types';

export const InspectionWizard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [items, setItems] = useState<Map<string, ChecklistItem>>(new Map());
  const [existingDefects, setExistingDefects] = useState<Map<string, GitHubIssue>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load user data from session storage
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }

    const parsedUser: User = JSON.parse(userData);
    setUser(parsedUser);

    // Load checklist data
    loadChecklistData(parsedUser);
  }, [navigate]);

  const loadChecklistData = async (userData: User) => {
    try {
      // Load checklist JSON
      const response = await fetch('/data/rescue_checklist.json');
      const data: ChecklistData = await response.json();
      setChecklist(data);

      // Initialize all items with 'present' status
      const itemsMap = new Map<string, ChecklistItem>();
      data.compartments.forEach(compartment => {
        compartment.items.forEach(itemName => {
          const itemId = `${compartment.id}:${itemName}`;
          itemsMap.set(itemId, {
            id: itemId,
            name: itemName,
            compartmentId: compartment.id,
            status: 'present',
          });
        });
      });
      setItems(itemsMap);

      // Fetch existing defects for this apparatus
      const defects = await githubService.checkExistingDefects(userData.apparatus);
      setExistingDefects(defects);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading inspection data. Please check your GitHub token configuration.');
      setIsLoading(false);
    }
  };

  const handleItemStatusChange = (itemId: string, status: ItemStatus, notes?: string) => {
    setItems(prevItems => {
      const newItems = new Map(prevItems);
      const item = newItems.get(itemId);
      if (item) {
        newItems.set(itemId, { ...item, status, notes });
      }
      return newItems;
    });
  };

  const handleSubmit = async () => {
    if (!user || !checklist) return;

    setIsSubmitting(true);

    try {
      // Collect all defects
      const defects: Array<{
        compartment: string;
        item: string;
        status: 'missing' | 'damaged';
        notes: string;
      }> = [];

      items.forEach((item) => {
        if (item.status !== 'present') {
          const compartment = checklist.compartments.find(
            c => c.id === item.compartmentId
          );
          defects.push({
            compartment: compartment?.title || item.compartmentId,
            item: item.name,
            status: item.status,
            notes: item.notes || '',
          });
        }
      });

      // Submit inspection
      await githubService.submitChecklist({
        user,
        apparatus: user.apparatus,
        date: new Date().toISOString(),
        items: Array.from(items.values()),
        defects,
      });

      // Clear session and navigate to completion screen
      sessionStorage.removeItem('user');
      alert('Inspection submitted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Error submitting inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inspection checklist...</p>
        </div>
      </div>
    );
  }

  if (!user || !checklist) {
    return null;
  }

  const currentCompartment = checklist.compartments[currentStep];
  const isLastStep = currentStep === checklist.compartments.length - 1;
  const canProceed = currentCompartment.items.every(itemName => {
    const itemId = `${currentCompartment.id}:${itemName}`;
    const item = items.get(itemId);
    return item?.status !== undefined;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900">{user.apparatus}</h1>
            <span className="text-sm text-gray-600">
              {user.name} · {user.rank}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {checklist.compartments.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all ${
                  idx < currentStep
                    ? 'bg-green-500'
                    : idx === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Step {currentStep + 1} of {checklist.compartments.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentCompartment.title}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentCompartment.items.map((itemName) => {
                const itemId = `${currentCompartment.id}:${itemName}`;
                const item = items.get(itemId);
                const defectKey = `${currentCompartment.title}:${itemName}`;
                const hasExistingDefect = existingDefects.has(defectKey);

                return (
                  <InspectionCard
                    key={itemId}
                    item={itemName}
                    compartmentId={currentCompartment.id}
                    status={item?.status || 'present'}
                    hasExistingDefect={hasExistingDefect}
                    onStatusChange={(status, notes) =>
                      handleItemStatusChange(itemId, status, notes)
                    }
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 0 && (
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>
          )}

          <div className="flex-1" />

          {!isLastStep ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Inspection
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};