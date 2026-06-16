/**
 * YoungRoots — useServices Hook
 * Fetches and filters SRHR services with debounce.
 */
import { useState, useEffect, useCallback } from 'react';
import { servicesAPI } from '../utils/api';

export function useServices(initialFilters = {}) {
  const [services,  setServices]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [filters,   setFilters]   = useState(initialFilters);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await servicesAPI.list({ ...filters, page });
      setServices(data.results ?? data);
      setTotal(data.count ?? (data.results ?? data).length);
    } catch (err) {
      setError('Could not load services. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = setTimeout(fetch, 350);
    return () => clearTimeout(timer);
  }, [fetch]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const searchNearby = (lat, lng, radius = 10) => {
    setFilters(prev => ({ ...prev, lat, lng, radius }));
    setPage(1);
  };

  return { services, loading, error, total, page, setPage, filters, updateFilter, searchNearby, refetch: fetch };
}
