import { useState, useEffect, useCallback } from 'react';

/**
 * Generic Supabase query hook.
 * Usage: const { data, loading, error, refetch } = useSupabaseQuery(() => missionsService.getActiveMissions())
 */
export function useSupabaseQuery(queryFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
