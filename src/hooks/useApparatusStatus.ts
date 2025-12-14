import { useState, useEffect } from 'react';
import { fetchApparatusStatus } from '../lib/inventory';
import type { ApparatusStatus } from '../lib/inventory';

interface UseApparatusStatusReturn {
  statuses: ApparatusStatus[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getVehicleNumber: (unit: string) => string | undefined;
}

/**
 * Hook to fetch and manage apparatus status data (apparatus-to-vehicle mappings)
 */
export function useApparatusStatus(): UseApparatusStatusReturn {
  const [statuses, setStatuses] = useState<ApparatusStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatuses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchApparatusStatus();
      setStatuses(data.statuses);
    } catch (err) {
      console.error('Error fetching apparatus status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch apparatus status');
    } finally {
      setLoading(false);
    }
  };

  // Get vehicle number for a specific apparatus unit
  const getVehicleNumber = (unit: string): string | undefined => {
    const status = statuses.find(s => s.unit === unit);
    return status?.vehicleNo;
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  return {
    statuses,
    loading,
    error,
    refetch: loadStatuses,
    getVehicleNumber,
  };
}
