import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

type FlagMap = Record<string, boolean>;

async function fetchFlags(): Promise<FlagMap> {
  const { data, error } = await supabase.from('feature_flag').select('key, enabled');
  if (error) throw error;
  return Object.fromEntries(data.map((f) => [f.key, f.enabled]));
}

export function useFlags() {
  return useQuery({
    queryKey: ['feature_flags'],
    queryFn: fetchFlags,
    staleTime: 60_000,
  });
}

export function useFlag(key: string): boolean {
  const { data } = useFlags();
  return data?.[key] ?? false;
}
