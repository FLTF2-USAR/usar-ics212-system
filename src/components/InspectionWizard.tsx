import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Calendar, Shield, Gauge } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent } from './ui/Card';
import { InspectionCard } from './InspectionCard';
import { githubService } from '../lib/github';
import type { User, ChecklistData, ChecklistItem, GitHubIssue, ItemStatus, OfficerChecklistItem } from '../types';

export const InspectionWizard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [items, setItems] = useState<Map<string, ChecklistItem>>(new Map());
  const [existingDefects, setExistingDefects] = useState<Map<string, GitHubIssue>>(new Map());
  const [officerItems, setOfficerItems] = useState<OfficerChecklistItem[]>([]);
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
      const response = await fetch('/mbfd-checkout-system/data/rescue_checklist.json');
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

      // Initialize officer checklist
      if (data.officerChecklist) {
        setOfficerItems(data.officerChecklist.map(item => ({
          ...item,
          checked: false,
          value: ''
        })));
      }

      // Fetch existing defects for this apparatus
      const defects = await githubService.checkExistingDefects(userData.apparatus);
      setExistingDefects(defects);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading inspection data. Please try again.');
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

  const handleOfficerItemChange = (index: number, checked: boolean, value?: string) => {
    setOfficerItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], checked, value };
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
        shift: user.shift,
        unitNumber: user.unitNumber,
        officerChecklist: officerItems,
      });

      // Clear session and navigate to completion screen
      sessionStorage.removeItem('user');
      alert('✅ Inspection submitted successfully!');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading inspection checklist...</p>
        </div>
      </div>
    );
  }

  if (!user || !checklist) {
    return null;
  }

  // Calculate total steps (officer checklist + all compartments)
  const hasOfficerChecklist = officerItems.length > 0;
  const totalSteps = (hasOfficerChecklist ? 1 : 0) + checklist.compartments.length;
  
  // Determine if we're on officer checklist step
  const isOfficerStep = hasOfficerChecklist && currentStep === 0;
  const compartmentIndex = hasOfficerChecklist ? currentStep - 1 : currentStep;
  const currentCompartment = !isOfficerStep ? checklist.compartments[compartmentIndex] : null;
  
  const isLastStep = currentStep === totalSteps - 1;
  
  // Check if current step is complete
  const canProceed = isOfficerStep 
    ? officerItems.every(item => item.checked)
    : currentCompartment?.items.every(itemName => {
        const itemId = `${currentCompartment.id}:${itemName}`;
        const item = items.get(itemId);
        return item?.status !== undefined;
      });

  // Get today's schedule
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = checklist.dailySchedule?.find(s => s.day === today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white sticky top-0 z-10 shadow-xl">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold">{user.apparatus}</h1>
              <p className="text-sm text-red-100">
                {user.name} • {user.rank}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-100">Shift {user.shift}</p>
              <p className="text-sm font-semibold">Unit {user.unitNumber}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  idx < currentStep
                    ? 'bg-green-400'
                    : idx === currentStep
                    ? 'bg-white'
                    : 'bg-red-400'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-red-100 mt-2 text-center font-medium">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Daily Schedule Banner */}
      {todaySchedule && todaySchedule.tasks.length > 0 && todaySchedule.tasks[0] !== 'None' && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-1">Today's Schedule - {today}</h3>
                <ul className="space-y-1">
                  {todaySchedule.tasks.map((task, idx) => (
                    <li key={idx} className="text-sm text-amber-800">• {task}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              {isOfficerStep ? (
                <Shield className="w-8 h-8 text-blue-600" />
              ) : (
                <Gauge className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isOfficerStep ? 'Officer Checklist' : currentCompartment?.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {isOfficerStep 
                    ? 'Complete all officer-specific checks'
                    : 'Check all equipment in this compartment'
                  }
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {isOfficerStep ? (
              <div className="space-y-3">
                {officerItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border-2 border-gray-200 transition-all hover:border-blue-400"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => handleOfficerItemChange(idx, e.target.checked, item.value)}
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-4 focus:ring-blue-400"
                    />
                    <label className="flex-1 font-medium text-gray-900 cursor-pointer">
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {currentCompartment?.items.map((itemName) => {
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 0 && (
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="secondary"
              className="flex items-center gap-2 h-14 px-6 rounded-xl font-bold"
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
              className="flex items-center gap-2 h-14 px-8 rounded-xl font-bold shadow-lg"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="flex items-center gap-2 h-14 px-8 rounded-xl font-bold shadow-lg bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
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