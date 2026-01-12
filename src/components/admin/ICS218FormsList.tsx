/**
 * ICS-218 Forms List Component
 * 
 * Displays list of ICS-218 Equipment & Vehicle Inventory forms
 * Features:
 * - Real-time search
 * - Pagination
 * - Click to view details
 * - Mobile-responsive cards
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonLoader } from '../mobile/SkeletonLoader';
import { TouchFeedback } from '../mobile/TouchFeedback';
import { Search, Truck, Calendar } from 'lucide-react';

interface ICS218Form {
 id: string;
  created_at: string;
  incident_name?: string;
  vehicle_category?: string;
  vehicleCount: number;
}

export function ICS218FormsList() {
  const [forms, setForms] = useState<ICS218Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/ics218/forms?limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error fetching ICS-218 forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredForms = forms.filter(form =>
    form.incident_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.vehicle_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.id.toString().includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} type="card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by incident name, category, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>{filteredForms.length} forms found</span>
        <button
          onClick={fetchForms}
          className="text-orange-600 dark:text-orange-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            No ICS-218 forms found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'Forms will appear here once submitted'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form) => (
            <TouchFeedback key={form.id}>
              <div
                onClick={() => navigate(`/admin/ics218/${form.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500"
              >
                {/* Form Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs font-semibold rounded-full">
                    ICS-218
                  </span>
                </div>

                {/* Form Details */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {form.incident_name || 'Unnamed Incident'}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(form.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Truck className="w-4 h-4" />
                    <span>{form.vehicleCount || 0} vehicles</span>
                  </div>
                  
                  {form.vehicle_category && (
                    <div className="mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 inline-block">
                      {form.vehicle_category}
                    </div>
                  )}
                </div>

                {/* View Button */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-orange-600 dark:text-orange-400 text-sm font-semibold hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            </TouchFeedback>
          ))}
        </div>
      )}
    </div>
  );
}
