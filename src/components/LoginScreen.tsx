import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import type { Rank, Shift, User } from '../types';

const ranks: Rank[] = ['Firefighter', 'DE', 'Lieutenant', 'Captain', 'Chief'];
const shifts: Shift[] = ['A', 'B', 'C'];

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>({
    name: '',
    rank: 'Firefighter',
    apparatus: 'Rescue 1',
    shift: 'A',
    unitNumber: 'R1',
  });

  const handleStartInspection = () => {
    if (!user.name.trim()) {
      alert('Please enter your name');
      return;
    }
    
    // Store user data in session storage
    sessionStorage.setItem('user', JSON.stringify(user));
    navigate('/inspection');
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardContent className="py-8 px-6">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl mb-4 shadow-lg">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              MBFD Checkout
            </h1>
            <p className="text-sm text-gray-500 font-medium mb-1">Miami Beach Fire Department</p>
            <p className="text-xs text-gray-400">{today}</p>
          </div>

          {/* Apparatus Display */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">APPARATUS</p>
            <p className="text-3xl font-bold text-red-700">RESCUE 1</p>
            <p className="text-xs text-gray-500 mt-1">Daily Equipment Inspection</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all text-base font-medium placeholder-gray-400"
              />
            </div>

            {/* Rank and Shift Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Rank Dropdown */}
              <div>
                <label htmlFor="rank" className="block text-sm font-bold text-gray-700 mb-2">
                  Rank
                </label>
                <div className="relative">
                  <select
                    id="rank"
                    value={user.rank}
                    onChange={(e) => setUser({ ...user, rank: e.target.value as Rank })}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-blue-400 focus:border-blue-500 outline-none appearance-none bg-white transition-all text-base font-medium"
                  >
                    {ranks.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Shift Dropdown */}
              <div>
                <label htmlFor="shift" className="block text-sm font-bold text-gray-700 mb-2">
                  Shift
                </label>
                <div className="relative">
                  <select
                    id="shift"
                    value={user.shift}
                    onChange={(e) => setUser({ ...user, shift: e.target.value as Shift })}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-blue-400 focus:border-blue-500 outline-none appearance-none bg-white transition-all text-base font-medium"
                  >
                    {shifts.map((shift) => (
                      <option key={shift} value={shift}>
                        Shift {shift}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Unit/Vehicle Number */}
            <div>
              <label htmlFor="unitNumber" className="block text-sm font-bold text-gray-700 mb-2">
                Unit/Vehicle #
              </label>
              <input
                id="unitNumber"
                type="text"
                value={user.unitNumber}
                onChange={(e) => setUser({ ...user, unitNumber: e.target.value })}
                placeholder="R1"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all text-base font-medium placeholder-gray-400"
              />
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartInspection}
              className="w-full mt-6 h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all rounded-xl"
              size="lg"
            >
              Start Inspection →
            </Button>

            {/* Admin Link */}
            <div className="text-center mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/admin')}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Admin Dashboard →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MBFD Badge at bottom */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-white text-xs font-medium opacity-80">
          Miami Beach Fire Department • Rescue 1
        </p>
      </div>
    </div>
  );
};