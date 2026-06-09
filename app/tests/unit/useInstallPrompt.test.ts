import { describe, it, expect } from 'vitest';
import { detectIOS, shouldShowPrompt } from '@/lib/useInstallPrompt';

describe('detectIOS', () => {
  it('true pra user agent de iPhone', () => {
    expect(detectIOS('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
  });
  it('false pra Android', () => {
    expect(detectIOS('Mozilla/5.0 (Linux; Android 14)')).toBe(false);
  });
});

describe('shouldShowPrompt', () => {
  it('mostra a partir da 2ª visita quando não-standalone e não-dispensado', () => {
    expect(shouldShowPrompt({ visits: 2, dismissed: false, standalone: false })).toBe(true);
  });
  it('esconde na 1ª visita', () => {
    expect(shouldShowPrompt({ visits: 1, dismissed: false, standalone: false })).toBe(false);
  });
  it('esconde se já dispensado', () => {
    expect(shouldShowPrompt({ visits: 9, dismissed: true, standalone: false })).toBe(false);
  });
  it('esconde se já instalado (standalone)', () => {
    expect(shouldShowPrompt({ visits: 9, dismissed: false, standalone: true })).toBe(false);
  });
});
