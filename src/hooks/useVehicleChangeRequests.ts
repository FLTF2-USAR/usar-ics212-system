import { useState, useEffect, useCallback } from 'react';
import { 
  fetchVehicleChangeRequests, 
  submitVehicleChangeRequest,
  reviewVehicleChangeRequest,
  type VehicleChangeRequest 
} from '../lib/inventory';

interface UseVehicleChangeRequestsReturn {
  requests: VehicleChangeRequest[];
  loading: boolean;
  error: string | null;
  pendingCount: number;
  totalCount: number;
  refetch: () => Promise<void>;
  submitRequest: (request: {
    apparatus: string;
    oldVehicleNo: string | null;
    newVehicleNo: string;
    reportedBy: string;
    notes?: string;
  }) => Promise<void>;
  approveRequest: (requestId: string, reviewedBy: string, notes?: string) => Promise<void>;
  rejectRequest: (requestId: string, reviewedBy: string, notes?: string) => Promise<void>;
}

interface UseVehicleChangeRequestsOptions {
  status?: 'pending' | 'approved' | 'rejected';
  pollInterval?: number; // Poll for updates (ms), 0 to disable
  autoFetch?: boolean;   // Fetch on mount
}

/**
 * Hook to manage vehicle change requests
 * Provides functions to submit, approve, reject, and monitor change requests
 */
export function useVehicleChangeRequests(
  options: UseVehicleChangeRequestsOptions = {}
): UseVehicleChangeRequestsReturn {
  const { 
    status, 
    pollInterval = 30000, // Default 30 seconds
    autoFetch = true 
  } = options;

  const [requests, setRequests] = useState<VehicleChangeRequest[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchVehicleChangeRequests(status);
      setRequests(data.requests);
      setPendingCount(data.pending);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Error fetching vehicle change requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle change requests');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const submitRequest = async (request: {
    apparatus: string;
    oldVehicleNo: string | null;
    newVehicleNo: string;
    reportedBy: string;
    notes?: string;
  }) => {
    try {
      await submitVehicleChangeRequest(request);
      // Refetch to get updated list
      await loadRequests();
    } catch (err) {
      console.error('Error submitting vehicle change request:', err);
      throw err;
    }
  };

  const approveRequest = async (requestId: string, reviewedBy: string, notes?: string) => {
    try {
      await reviewVehicleChangeRequest(requestId, 'approve', reviewedBy, notes);
      // Refetch to get updated list
      await loadRequests();
    } catch (err) {
      console.error('Error approving vehicle change request:', err);
      throw err;
    }
  };

  const rejectRequest = async (requestId: string, reviewedBy: string, notes?: string) => {
    try {
      await reviewVehicleChangeRequest(requestId, 'reject', reviewedBy, notes);
      // Refetch to get updated list
      await loadRequests();
    } catch (err) {
      console.error('Error rejecting vehicle change request:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      loadRequests();
    }
  }, [loadRequests, autoFetch]);

  // Polling for updates (if enabled)
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(loadRequests, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, loadRequests]);

  return {
    requests,
    loading,
    error,
    pendingCount,
    totalCount,
    refetch: loadRequests,
    submitRequest,
    approveRequest,
    rejectRequest,
  };
}
