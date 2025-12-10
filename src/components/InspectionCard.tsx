import React, { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { ItemStatus } from '../types';

interface InspectionCardProps {
  item: string;
  compartmentId: string;
  status: ItemStatus;
  hasExistingDefect: boolean;
  onStatusChange: (status: ItemStatus, notes?: string) => void;
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

  const handleStatusClick = (newStatus: ItemStatus) => {
    if (newStatus === 'present') {
      onStatusChange('present');
    } else {
      setModalType(newStatus);
      setShowNotesModal(true);
    }
  };

  const handleSubmitNotes = () => {
    if (!notes.trim()) {
      alert('Please enter notes describing the issue');
      return;
    }
    onStatusChange(modalType, notes);
    setShowNotesModal(false);
    setNotes('');
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-xl transition-all border-2',
          {
            'bg-white border-gray-200': status === 'present' && !hasExistingDefect,
            'bg-green-50 border-green-500': status === 'present' && !hasExistingDefect,
            'bg-red-50 border-red-500': status === 'missing',
            'bg-yellow-50 border-yellow-500': status === 'damaged',
            'bg-orange-50 border-orange-500': hasExistingDefect,
          }
        )}
      >
        {/* Item Name */}
        <div className="flex-1">
          <p className="font-medium text-gray-900">{item}</p>
          {hasExistingDefect && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-semibold rounded">
              Reported Missing
            </span>
          )}
        </div>

        {/* Status Buttons */}
        <div className="flex gap-2 ml-4">
          {/* Present Button */}
          <button
            onClick={() => handleStatusClick('present')}
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl transition-all',
              status === 'present'
                ? 'bg-green-500 text-white shadow-lg scale-110'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            )}
            title="Present/Working"
          >
            <Check className="w-6 h-6" />
          </button>

          {/* Missing Button */}
          <button
            onClick={() => handleStatusClick('missing')}
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl transition-all',
              status === 'missing'
                ? 'bg-red-500 text-white shadow-lg scale-110'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            )}
            title="Missing"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Damaged Button */}
          <button
            onClick={() => handleStatusClick('damaged')}
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl transition-all',
              status === 'damaged'
                ? 'bg-yellow-500 text-white shadow-lg scale-110'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            )}
            title="Damaged"
          >
            <AlertTriangle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setNotes('');
        }}
        title={modalType === 'missing' ? 'Item Missing' : 'Item Damaged'}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide details about this {modalType} item:
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the issue..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          />
          <div className="flex gap-3">
            <Button
              onClick={handleSubmitNotes}
              className="flex-1"
            >
              Submit Report
            </Button>
            <Button
              onClick={() => {
                setShowNotesModal(false);
                setNotes('');
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};