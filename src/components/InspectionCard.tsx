import React, { useState, useRef } from 'react';
import { Check, X, AlertTriangle, Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { ItemStatus, CompartmentItem } from '../types';

interface InspectionCardProps {
  item: string | CompartmentItem;
  compartmentId: string;
  status: ItemStatus;
  hasExistingDefect: boolean;
  onStatusChange: (status: ItemStatus, notes?: string, photoUrl?: string) => void;
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
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract item data
  const itemName = typeof item === 'string' ? item : item.name;
  const expectedQuantity = typeof item === 'object' ? item.expectedQuantity : undefined;
  const itemNote = typeof item === 'object' ? item.note : undefined;

  const handleStatusClick = (newStatus: ItemStatus) => {
    if (newStatus === 'present') {
      onStatusChange('present');
      setNotes('');
      setPhotoPreview('');
    } else {
      setModalType(newStatus);
      setShowNotesModal(true);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNotes = () => {
    if (!notes.trim()) {
      alert('Please enter notes describing the issue');
      return;
    }
    onStatusChange(modalType, notes, photoPreview);
    setShowNotesModal(false);
    setNotes('');
    setPhotoPreview('');
  };

  const handleCancel = () => {
    setShowNotesModal(false);
    setNotes('');
    setPhotoPreview('');
  };

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
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Photo (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Issue preview"
                  className="w-full h-48 object-cover rounded-xl border-2 border-gray-300"
                />
                <button
                  onClick={() => {
                    setPhotoPreview('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center active:scale-95"
              >
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">
                  Tap to take a photo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Document the issue visually
                </p>
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmitNotes}
              className="flex-1 h-12 text-base font-bold rounded-xl"
            >
              {photoPreview ? (
                <>
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Submit with Photo
                </>
              ) : (
                <>Submit Report</>
              )}
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