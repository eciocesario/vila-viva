import { describe, it, expect } from 'vitest';
import { validateOnboarding, type OnboardingData } from '@/domain/onboardingValidation';

describe('validateOnboarding', () => {
  const valid: OnboardingData = {
    nome: 'Maria Silva',
    agente: 'tecedor',
    casa: 'Casa do Vento',
    intencao: 'Tecer redes.',
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

  it('rejeita agente fora da lista de 14', () => {
    const r = validateOnboarding({ ...valid, agente: 'inexistente' as never });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors.agente).toBeDefined();
  });

  it('aceita casa vazia (opcional)', () => {
    expect(validateOnboarding({ ...valid, casa: '' }).ok).toBe(true);
  });

  it('rejeita intencao com mais de 280 caracteres', () => {
    const r = validateOnboarding({ ...valid, intencao: 'x'.repeat(281) });
    expect(r.ok).toBe(false);
  });
});
