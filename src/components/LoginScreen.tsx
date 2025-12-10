import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import type { Apparatus, Rank, User } from '../types';

const ranks: Rank[] = ['Firefighter', 'DE', 'Lieutenant', 'Captain', 'Chief'];
const apparatuses: Apparatus[] = ['Rescue 1', 'Rescue 2', 'Rescue 3', 'Rescue 11', 'Engine 1'];

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>({
    name: '',
    rank: 'Firefighter',
    apparatus: 'Rescue 1',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              MBFD Checkout System
            </h1>
            <p className="text-gray-600">Daily Apparatus Inspection</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Rank Dropdown */}
            <div>
              <label htmlFor="rank" className="block text-sm font-semibold text-gray-700 mb-2">
                Rank
              </label>
              <div className="relative">
                <select
                  id="rank"
                  value={user.rank}
                  onChange={(e) => setUser({ ...user, rank: e.target.value as Rank })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white transition-all"
                >
                  {ranks.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Apparatus Dropdown */}
            <div>
              <label htmlFor="apparatus" className="block text-sm font-semibold text-gray-700 mb-2">
                Apparatus
              </label>
              <div className="relative">
                <select
                  id="apparatus"
                  value={user.apparatus}
                  onChange={(e) => setUser({ ...user, apparatus: e.target.value as Apparatus })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white transition-all"
                >
                  {apparatuses.map((apparatus) => (
                    <option key={apparatus} value={apparatus}>
                      {apparatus}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartInspection}
              className="w-full mt-6"
              size="lg"
            >
              Start Inspection
            </Button>

            {/* Admin Link */}
            <div className="text-center mt-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Admin Dashboard →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};