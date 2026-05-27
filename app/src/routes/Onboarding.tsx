import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { PERFIS, validateOnboarding, type OnboardingData } from '@/domain/onboardingValidation';
import { track } from '@/lib/posthog';

const STEPS = ['Nome', 'Perfil', 'Casa', 'Intenção'] as const;

export default function Onboarding() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    nome: '',
    perfil_tipo: '',
    casa: '',
    intencao: '',
  });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (d: OnboardingData) => {
      const valid = validateOnboarding(d);
      if (!valid.ok) throw new Error(Object.values(valid.errors).join(' '));

      const { error } = await supabase
        .from('profile')
        .update({
          nome: d.nome,
          perfil_tipo: d.perfil_tipo,
          casa: d.casa || null,
          intencao: d.intencao || null,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', session!.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      track('onboarding_completed');
      nav('/');
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Erro ao salvar'),
  });

  function next() {
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else save.mutate(data);
  }

  function back() {
    setError(null);
    if (step > 0) setStep(step - 1);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full">
        <p className="text-xs opacity-60 mb-1">Passo {step + 1} de {STEPS.length}</p>
        <h2 className="font-display text-2xl text-terra mb-6">{STEPS[step]}</h2>

        {step === 0 && (
          <input
            type="text"
            placeholder="Seu nome completo"
            value={data.nome}
            onChange={(e) => setData({ ...data, nome: e.target.value })}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          />
        )}
        {step === 1 && (
          <select
            value={data.perfil_tipo}
            onChange={(e) => setData({ ...data, perfil_tipo: e.target.value })}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          >
            <option value="">Escolha um perfil…</option>
            {PERFIS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
        {step === 2 && (
          <input
            type="text"
            placeholder="Casa onde mora (opcional)"
            value={data.casa}
            onChange={(e) => setData({ ...data, casa: e.target.value })}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          />
        )}
        {step === 3 && (
          <textarea
            placeholder="Sua intenção em Piracanga (até 280 caracteres)"
            maxLength={280}
            value={data.intencao}
            onChange={(e) => setData({ ...data, intencao: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          />
        )}

        {error && <p className="mt-3 text-sm text-terra">{error}</p>}

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <button onClick={back} className="px-4 py-3 rounded-soft border border-carvao/20">
              Voltar
            </button>
          )}
          <button
            onClick={next}
            disabled={save.isPending}
            className="flex-1 px-4 py-3 rounded-soft bg-terra text-areia font-medium disabled:opacity-50"
          >
            {step === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </main>
  );
}
