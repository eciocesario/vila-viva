import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '@/components/OfflineBanner';

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

describe('OfflineBanner', () => {
  afterEach(() => setNavigatorOnline(true));

  it('não renderiza nada quando online', () => {
    setNavigatorOnline(true);
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra aviso quando offline', () => {
    setNavigatorOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i);
  });
});
