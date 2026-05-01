/**
 * useEnrollment.js
 *
 * Thin React hook that wraps the enrollment API call with loading / error /
 * success state so any component can wire in the submission without
 * coupling to fetch directly.
 *
 * Usage in EnrollModal.jsx (one-liner):
 *   const { submit, loading, error, success, data } = useEnrollment();
 *   // Replace the `setSubmitted(true)` call with: await submit(formData)
 */

import { useState, useCallback } from 'react';
import { createEnrollment } from '../services/enrollmentApi';

/**
 * @returns {{
 *   submit: (data: object) => Promise<void>,
 *   loading: boolean,
 *   error: string | null,
 *   success: boolean,
 *   data: object | null,
 *   reset: () => void,
 * }}
 */
export function useEnrollment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState(null);

  /**
   * Submit the enrollment form data to the backend.
   * On success, sets `success = true` and `data` to the enrollment record.
   * On failure, sets `error` to a human-readable message.
   *
   * @param {object} formData - must match CreateEnrollmentInput shape
   */
  const submit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setData(null);

    try {
      const response = await createEnrollment(formData);
      setData(response.data ?? response);
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Enrollment failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset the hook back to its initial state (e.g. when the modal closes).
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setData(null);
  }, []);

  return { submit, loading, error, success, data, reset };
}
