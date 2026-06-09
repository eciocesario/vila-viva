import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstallPrompt } from '@/components/InstallPrompt';
import * as hook from '@/lib/useInstallPrompt';

afterEach(() => vi.restoreAllMocks());

describe('InstallPrompt', () => {
  it('não renderiza quando visible=false', () => {
    vi.spyOn(hook, 'useInstallPrompt').mockReturnValue({
      visible: false, isIOS: false, install: vi.fn(), dismiss: vi.fn(),
    });
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra botão Instalar no Android/Chrome', () => {
    vi.spyOn(hook, 'useInstallPrompt').mockReturnValue({
      visible: true, isIOS: false, install: vi.fn(), dismiss: vi.fn(),
    });
    render(<InstallPrompt />);
    expect(screen.getByRole('button', { name: /instalar/i })).toBeInTheDocument();
  });

  it('mostra instrução de Compartilhar no iOS', () => {
    vi.spyOn(hook, 'useInstallPrompt').mockReturnValue({
      visible: true, isIOS: true, install: vi.fn(), dismiss: vi.fn(),
    });
    render(<InstallPrompt />);
    expect(screen.getByText(/adicionar à tela de início/i)).toBeInTheDocument();
  });
});
