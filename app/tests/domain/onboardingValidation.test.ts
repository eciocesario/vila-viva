import { describe, it, expect } from 'vitest';
import { validateOnboarding, type OnboardingData } from '@/domain/onboardingValidation';

describe('validateOnboarding', () => {
  const valid: OnboardingData = {
    nome: 'Maria Silva',
    perfil_tipo: 'cultivador',
    casa: 'Casa do Vento',
    intencao: 'Cuidar da terra.',
  };

  it('aceita dados válidos', () => {
    expect(validateOnboarding(valid).ok).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const r = validateOnboarding({ ...valid, nome: '' });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors.nome).toBeDefined();
  });

  it('rejeita nome com menos de 2 caracteres', () => {
    const r = validateOnboarding({ ...valid, nome: 'M' });
    expect(r.ok).toBe(false);
  });

  it('rejeita perfil_tipo fora da lista de onboarding', () => {
    const r = validateOnboarding({ ...valid, perfil_tipo: 'inexistente' as never });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors.perfil_tipo).toBeDefined();
  });

  it('rejeita observador (fora do MVP) no onboarding', () => {
    const r = validateOnboarding({ ...valid, perfil_tipo: 'observador' });
    expect(r.ok).toBe(false);
  });

  it('aceita casa vazia (opcional)', () => {
    expect(validateOnboarding({ ...valid, casa: '' }).ok).toBe(true);
  });

  it('rejeita intencao com mais de 280 caracteres', () => {
    const r = validateOnboarding({ ...valid, intencao: 'x'.repeat(281) });
    expect(r.ok).toBe(false);
  });
});
