import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { getSession, onAuthStateChange } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession, onAuthStateChange, signInWithOtp: vi.fn(), signOut: vi.fn() },
  },
}));
vi.mock('@/lib/posthog', () => ({ identify: vi.fn() }));

import { AuthProvider, useAuth } from '@/lib/useAuth';

function Consumer({ label }: { label: string }) {
  const { session, loading } = useAuth();
  return (
    <span>
      {label}:{loading ? 'loading' : (session?.user.id ?? 'none')}
    </span>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    getSession.mockReset();
    onAuthStateChange.mockClear();
  });

  it('compartilha UMA sessão entre todos os consumidores (getSession chamado 1x)', async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'a@b.c' } } },
    });

    render(
      <AuthProvider>
        <Consumer label="A" />
        <Consumer label="B" />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('A:user-123')).toBeInTheDocument();
      expect(screen.getByText('B:user-123')).toBeInTheDocument();
    });
    // O cerne da correção: uma fonte de sessão, não uma por componente.
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('useAuth fora do provider lança erro claro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer label="X" />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
