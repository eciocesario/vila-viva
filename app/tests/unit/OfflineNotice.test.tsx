import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineNotice } from '@/components/OfflineNotice';

describe('OfflineNotice', () => {
  it('mostra mensagem de offline', () => {
    render(<OfflineNotice />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('orienta que o conteúdo já aberto segue disponível', () => {
    render(<OfflineNotice />);
    expect(screen.getByText(/Feed|Vagas/)).toBeInTheDocument();
  });
});
