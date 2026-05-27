import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { POST_TIPOS, postTipoLabel, type PostTipo } from '@/domain/postTypes';
import { track } from '@/lib/posthog';

export function PostCreator() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const canCreateOutros = useFlag('feed_create_outros');
  const canCreateHistoria = useFlag('feed_create_historia');
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<PostTipo>('historia');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');

  const tiposPermitidos = POST_TIPOS.filter((t) =>
    t === 'historia' ? canCreateHistoria : canCreateOutros
  );

  const create = useMutation({
    mutationFn: async () => {
      if (!corpo.trim()) throw new Error('Corpo é obrigatório.');
      const { error } = await supabase.from('post').insert({
        autor_id: session!.user.id,
        tipo,
        titulo: titulo || null,
        corpo: corpo.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      track('post_created', { tipo });
      void qc.invalidateQueries({ queryKey: ['feed'] });
      setOpen(false);
      setTitulo('');
      setCorpo('');
    },
  });

  if (tiposPermitidos.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-terra text-areia text-3xl shadow-lg"
        aria-label="Criar post"
      >+</button>

      {open && (
        <div className="fixed inset-0 bg-carvao/40 flex items-end z-40" onClick={() => setOpen(false)}>
          <div
            className="w-full bg-areia rounded-t-card p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-terra mb-3">Novo post</h3>

            <label className="block text-xs opacity-70 mb-1">Tipo</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {tiposPermitidos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    tipo === t ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
                  }`}
                >{postTipoLabel(t)}</button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Título (opcional)"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />
            <textarea
              placeholder="O que você quer compartilhar?"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white"
            />

            {create.error && (
              <p className="mt-2 text-sm text-terra">{(create.error as Error).message}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-soft border border-carvao/20">
                Cancelar
              </button>
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !corpo.trim()}
                className="flex-1 px-4 py-2 rounded-soft bg-terra text-areia disabled:opacity-50"
              >
                {create.isPending ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
