import { useParams, Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/posthog';
import { useFlag } from '@/lib/useFlag';
import { useAuth } from '@/lib/useAuth';
import { vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';
import { InteresseButton } from '@/components/InteresseButton';

export default function VagaDetail() {
  const enabled = useFlag('vagas');
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const { data: vaga, isLoading, error } = useQuery({
    queryKey: ['vaga', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga')
        .select(`
          id, tipo, titulo, descricao, local, periodo, valor_remuneracao,
          status, count_interesses, created_at, autor_id,
          autor:profile!autor_id(id, nome, perfil_tipo, casa),
          skills:vaga_skill(skill:skill_id(rotulo))
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && enabled,
  });

  if (!enabled) return <Navigate to="/" replace />;
  if (isLoading) return <main className="p-6">Carregando…</main>;
  if (error || !vaga) return <main className="p-6 text-terra">Vaga não encontrada.</main>;

  type Autor = { id: string; nome: string; perfil_tipo: string; casa: string | null };
  const autor = vaga.autor as unknown as Autor;
  const skills = (vaga.skills as { skill: { rotulo: string } | null }[])
    .map((s) => s.skill?.rotulo).filter(Boolean) as string[];
  const isAutor = session?.user.id === vaga.autor_id;

  const qc = useQueryClient();
  const fechar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('vaga')
        .update({ status: 'fechada' })
        .eq('id', vaga!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vaga', vaga!.id] });
      void qc.invalidateQueries({ queryKey: ['vagas'] });
      track('vaga_closed', { vaga_id: vaga!.id });
    },
  });

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider opacity-60">
          {vagaTipoLabel(vaga.tipo as VagaTipo)}
        </span>
        {vaga.status === 'fechada' && (
          <span className="text-xs px-2 py-1 rounded-full bg-carvao/20">Fechada</span>
        )}
      </div>

      <h1 className="font-display text-3xl text-terra">{vaga.titulo}</h1>

      <p className="text-sm">
        <Link to={`/profile/${autor.id}`} className="text-terra hover:underline">
          {autor.nome}
        </Link>{' '}
        · {PERFIL_LABELS[autor.perfil_tipo as Perfil] ?? autor.perfil_tipo}
        {autor.casa && ` · ${autor.casa}`}
      </p>

      <p className="whitespace-pre-wrap leading-relaxed">{vaga.descricao}</p>

      {(vaga.local || vaga.periodo || vaga.valor_remuneracao) && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm bg-white/60 rounded-soft p-3">
          {vaga.local && (<><dt className="opacity-60">Local</dt><dd>{vaga.local}</dd></>)}
          {vaga.periodo && (<><dt className="opacity-60">Período</dt><dd>{vaga.periodo}</dd></>)}
          {vaga.valor_remuneracao && (<><dt className="opacity-60">Valor</dt><dd>{vaga.valor_remuneracao}</dd></>)}
        </dl>
      )}

      {skills.length > 0 && (
        <div>
          <p className="text-xs opacity-60 mb-1">Habilidades requeridas</p>
          <div className="flex gap-1 flex-wrap">
            {skills.map((r) => (
              <span key={r} className="px-2 py-1 rounded-full bg-mata/10 text-xs">{r}</span>
            ))}
          </div>
        </div>
      )}

      {vaga.status === 'aberta' && (
        <InteresseButton vagaId={vaga.id} autorId={vaga.autor_id} countServer={vaga.count_interesses} />
      )}

      {(() => {
        const url = `${window.location.origin}/vagas/${vaga.id}`;
        const text = `"${vaga.titulo}" — vaga de ${autor.nome} na Vila Viva: ${url}`;
        return (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('vaga_share_wa_clicked', { vaga_id: vaga.id })}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mata/10 text-mata"
          >
            Compartilhar no WhatsApp
          </a>
        );
      })()}

      {isAutor && (
        <div className="pt-4 border-t border-carvao/10 space-y-2">
          <Link
            to={`/vagas/${vaga.id}/interessados`}
            className="block w-full px-4 py-2 rounded-soft border border-carvao/20 text-center text-sm"
          >
            Ver interessados ({vaga.count_interesses})
          </Link>
          {vaga.status === 'aberta' && (
            <button
              onClick={() => {
                if (confirm('Fechar a vaga? Ela some da lista pública.')) fechar.mutate();
              }}
              disabled={fechar.isPending}
              className="w-full px-4 py-2 rounded-soft border border-terra/40 text-terra text-sm disabled:opacity-50"
            >
              {fechar.isPending ? 'Fechando…' : 'Fechar vaga'}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
