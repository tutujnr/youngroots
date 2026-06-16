/**
 * YoungRoots — useCase Hook
 * Manages case lookup, status, and step tracking.
 */
import { useState, useCallback } from 'react';
import { referralsAPI } from '../utils/api';

export function useCase() {
  const [caseData, setCaseData] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const lookup = useCallback(async (caseId) => {
    if (!caseId?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await referralsAPI.getCaseDetail(caseId.trim().toUpperCase());
      setCaseData(data);
      return data;
    } catch {
      setError('Case not found. Please check your case ID.');
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeStep = useCallback(async (stepId) => {
    try {
      await referralsAPI.updateStep(stepId, { status: 'done' });
      // Refresh case data
      if (caseData?.case_id) await lookup(caseData.case_id);
    } catch {
      setError('Could not update step.');
    }
  }, [caseData, lookup]);

  return { caseData, loading, error, lookup, completeStep };
}
