import React, { useState } from 'react';
import { Check, X, AlertTriangle, WrenchIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { ItemStatus, CompartmentItem } from '../types';

interface InspectionCardProps {
  item: string | CompartmentItem;
  compartmentId: string;
  status: ItemStatus;
  hasExistingDefect: boolean;
  onStatusChange: (status: ItemStatus, notes?: string, photoUrl?: string, fixedStatus?: 'fixed' | 'still_damaged', radioNumber?: string) => void;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({
  item,
  status,
  hasExistingDefect,
  onStatusChange,
}) => {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [modalType, setModalType] = useState<'missing' | 'damaged'>('missing');
  const [notes, setNotes] = useState('');
  const [showDefectStatusModal, setShowDefectStatusModal] = useState(false);
  const [radioNumber, setRadioNumber] = useState('');

  // Extract item data
  const itemName = typeof item === 'string' ? item : item.name;
  const expectedQuantity = typeof item === 'object' ? item.expectedQuantity : undefined;
  const itemNote = typeof item === 'object' ? item.note : undefined;
  const inputType = typeof item === 'object' ? item.inputType : 'checkbox';

  // Check if this is a radio item that needs special handling
  const isRadioItem = inputType === 'radio' || (typeof item === 'object' && item.name.toLowerCase().includes('radio'));

  const handleStatusClick = (newStatus: ItemStatus) => {
    if (newStatus === 'present') {
      // If there's an existing defect, show the fixed/still damaged modal
      if (hasExistingDefect) {
        setShowDefectStatusModal(true);
      } else {
        onStatusChange('present', undefined, undefined, undefined, radioNumber);
        setNotes('');
      }
    } else {
      setModalType(newStatus);
      setShowNotesModal(true);
    }
  };

  const handleDefectStatusChoice = (choice: 'fixed' | 'still_damaged' | 'no_change') => {
    if (choice === 'fixed') {
      onStatusChange('present', 'Item has been fixed and is now back in service', undefined, 'fixed');
    } else if (choice === 'still_damaged') {
      onStatusChange('damaged', 'Issue still present - previously reported', undefined, 'still_damaged');
    } else {
      // no_change - just mark as present without additional notification
      onStatusChange('present');
    }
    setShowDefectStatusModal(false);
  };

  const handleSubmitNotes = () => {
    if (!notes.trim()) {
      alert('Please enter notes describing the issue');
      return;
    }
    onStatusChange(modalType, notes, undefined, undefined, radioNumber);
    setShowNotesModal(false);
    setNotes('');
  };

  const handleCancel = () => {
    setShowNotesModal(false);
    setNotes('');
  };

  // Special rendering for radio items with text input
  if (isRadioItem) {
    return (
      <>
        <div
          className={cn(
            'p-4 rounded-2xl transition-all duration-200 border-2 shadow-sm space-y-3',
            {
              'bg-white border-gray-200 hover:border-gray-300': status === 'present' && !hasExistingDefect,
              'bg-green-50 border-green-500 shadow-green-100': status === 'present' && !hasExistingDefect,
              'bg-red-50 border-red-500 shadow-red-100': status === 'missing',
              'bg-yellow-50 border-yellow-500 shadow-yellow-100': status === 'damaged',
              'bg-orange-50 border-orange-500 shadow-orange-100': hasExistingDefect,
            }
          )}
        >
          {/* Item Name and Status Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className="font-semibold text-gray-900 text-base leading-tight">
                {itemName}
              </p>
              {itemNote && (
                <p className="text-xs text-gray-500 mt-1">{itemNote}</p>
              )}
              {hasExistingDefect && (
                <span className="inline-block mt-2 px-3  py-1 bg-orange-600 text-white text-xs font-bold rounded-full shadow-sm">
                  ⚠️ Previously Reported
                </span>
              )}
            </div>

            {/* Status Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleStatusClick('present')}
                className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-95',
                  status === 'present'
                    ? 'bg-green-500 text-white shadow-lg scale-105 shadow-green-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
                )}
                title="Present/Working"
              >
                <Check className="w-7 h-7 stroke-[3]" />
              </button>

              <button
                onClick={() => handleStatusClick('missing')}
                className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-95',
                  status === 'missing'
                    ? 'bg-red-500 text-white shadow-lg scale-105 shadow-red-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
                )}
                title="Missing"
              >
                <X className="w-7 h-7 stroke-[3]" />
              </button>

              <button
                onClick={() => handleStatusClick('damaged')}
                className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-95',
                  status === 'damaged'
                    ? 'bg-yellow-500 text-white shadow-lg scale-105 shadow-yellow-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
                )}
                title="Damaged"
              >
                <AlertTriangle className="w-7 h-7 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Radio Number Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Radio Number (Optional):
            </label>
            <input
              type="text"
              value={radioNumber}
              onChange={(e) => setRadioNumber(e.target.value)}
              placeholder="Enter radio #"
              className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none bg-white text-gray-900 font-medium"
            />
          </div>
        </div>

        {/* Include the modals for radio items too */}
        <Modal
          isOpen={showDefectStatusModal}
          onClose={() => setShowDefectStatusModal(false)}
          title={`Previously Reported Issue: "${itemName}"`}
        >
          <div className="space-y-4">
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
              <p className="text-sm text-orange-900 font-semibold mb-2">
                ⚠️ This item was previously reported as defective.
              </p>
              <p className="text-xs text-orange-800">
                Please select the current status of this item:
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleDefectStatusChoice('fixed')}
                className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2"
              >
                <WrenchIcon className="w-5 h-5" />
                Fixed / Back in Service
              </Button>

              <Button
                onClick={() => handleDefectStatusChoice('still_damaged')}
                variant="secondary"
                className="w-full h-14 text-base font-bold rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-900 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                Still Damaged / Missing
              </Button>

              <Button
                onClick={() => handleDefectStatusChoice('no_change')}
                variant="secondary"
                className="w-full h-12 text-sm font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Skip - No Change
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showNotesModal}
          onClose={handleCancel}
          title={`Item ${modalType === 'missing' ? 'Missing' : 'Damaged'}: "${itemName}"`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100">
              {modalType === 'missing' ? (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-6 h-6 text-red-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  {modalType === 'missing' ? 'Missing Equipment' : 'Damaged Equipment'}
                </p>
                <p className="text-xs text-gray-500">Please provide detailed information</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all resize-none text-base"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide as much detail as possible to help with resolution
              </p>
            </div>

            {isRadioItem && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Radio Number (if known)
                </label>
                <input
                  type="text"
                  value={radioNumber}
                  onChange={(e) => setRadioNumber(e.target.value)}
                  placeholder="Enter radio # if known"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none bg-white text-gray-900"
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                📸 <strong>Photo upload coming soon!</strong> For now, please include detailed descriptions in your notes.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmitNotes}
                className="flex-1 h-12 text-base font-bold rounded-xl"
              >
                Submit Report
              </Button>
              <Button
                onClick={handleCancel}
                variant="secondary"
                className="flex-1 h-12 text-base font-bold rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 shadow-sm',
          {
            'bg-white border-gray-200 hover:border-gray-300': status === 'present' && !hasExistingDefect,
            'bg-green-50 border-green-500 shadow-green-100': status === 'present' && !hasExistingDefect,
            'bg-red-50 border-red-500 shadow-red-100': status === 'missing',
            'bg-yellow-50 border-yellow-500 shadow-yellow-100': status === 'damaged',
            'bg-orange-50 border-orange-500 shadow-orange-100': hasExistingDefect,
          }
        )}
      >
        {/* Item Name */}
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-semibold text-gray-900 text-base leading-tight">
            {itemName}
            {expectedQuantity && (
              <span className="text-sm text-gray-600 ml-1">({expectedQuantity})</span>
            )}
          </p>
          {itemNote && (
            <p className="text-xs text-gray-500 mt-1">{itemNote}</p>
          )}
          {hasExistingDefect && (
            <span className="inline-block mt-2 px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full shadow-sm">
              ⚠️ Previously Reported
            </span>
          )}
        </div>

        {/* Status Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Present Button */}
          <button
            onClick={() => handleStatusClick('present')}
            className={cn(
              'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-95',
              status === 'present'
                ? 'bg-green-500 text-white shadow-lg scale-105 shadow-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
            )}
            title="Present/Working"
          >
            <Check className="w-7 h-7 stroke-[3]" />
          </button>

          {/* Missing Button */}
          <button
            onClick={() => handleStatusClick('missing')}
            className={cn(
              'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-95',
              status === 'missing'
                ? 'bg-red-500 text-white shadow-lg scale-105 shadow-red-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
            )}
            title="Missing"
          >
            <X className="w-7 h-7 stroke-[3]" />
          </button>

          {/* Damaged Button */}
          <button
            onClick={() => handleStatusClick('damaged')}
            className={cn(
              'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-95',
              status === 'damaged'
                ? 'bg-yellow-500 text-white shadow-lg scale-105 shadow-yellow-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
            )}
            title="Damaged"
          >
            <AlertTriangle className="w-7 h-7 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Defect Status Modal (for previously reported items) */}
      <Modal
        isOpen={showDefectStatusModal}
        onClose={() => setShowDefectStatusModal(false)}
        title={`Previously Reported Issue: "${itemName}"`}
      >
        <div className="space-y-4">
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
            <p className="text-sm text-orange-900 font-semibold mb-2">
              ⚠️ This item was previously reported as defective.
            </p>
            <p className="text-xs text-orange-800">
              Please select the current status of this item:
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => handleDefectStatusChoice('fixed')}
              className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2"
            >
              <WrenchIcon className="w-5 h-5" />
              Fixed / Back in Service
            </Button>

            <Button
              onClick={() => handleDefectStatusChoice('still_damaged')}
              variant="secondary"
              className="w-full h-14 text-base font-bold rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-900 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Still Damaged / Missing
            </Button>

            <Button
              onClick={() => handleDefectStatusChoice('no_change')}
              variant="secondary"
              className="w-full h-12 text-sm font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Skip - No Change
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={handleCancel}
        title={`Item ${modalType === 'missing' ? 'Missing' : 'Damaged'}: "${itemName}"`}
      >
        <div className="space-y-4">
          {/* Issue Type Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100">
            {modalType === 'missing' ? (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X className="w-6 h-6 text-red-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-600">
                {modalType === 'missing' ? 'Missing Equipment' : 'Damaged Equipment'}
              </p>
              <p className="text-xs text-gray-500">Please provide detailed information</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all resize-none text-base"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide as much detail as possible to help with resolution
            </p>
          </div>

          {/* TODO: Photo upload will be implemented in future update */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              📸 <strong>Photo upload coming soon!</strong> For now, please include detailed descriptions in your notes.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmitNotes}
              className="flex-1 h-12 text-base font-bold rounded-xl"
            >
              Submit Report
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1 h-12 text-base font-bold rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};