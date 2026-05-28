import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { VAGA_TIPOS, vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { VagaSkillSelector } from './VagaSkillSelector';

export function VagaCreator() {
  const { session } = useAuth();
  const enabled = useFlag('vagas');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<VagaTipo>('voluntariado');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [valor, setValor] = useState('');
  const [skills, setSkills] = useState<Set<string>>(new Set());

  const create = useMutation({
    mutationFn: async () => {
      const tituloT = titulo.trim();
      const descT = descricao.trim();
      if (tituloT.length < 3 || tituloT.length > 80) throw new Error('Título precisa ter 3-80 caracteres.');
      if (descT.length < 10 || descT.length > 2000) throw new Error('Descrição precisa ter 10-2000 caracteres.');

      const { data: vagaRow, error: e1 } = await supabase
        .from('vaga')
        .insert({
          autor_id: session!.user.id,
          tipo,
          titulo: tituloT,
          descricao: descT,
          local: local.trim() || null,
          periodo: periodo.trim() || null,
          valor_remuneracao: tipo === 'remunerado' && valor.trim() ? valor.trim() : null,
        })
        .select('id')
        .single();
      if (e1) throw e1;

      if (skills.size > 0 && vagaRow) {
        const rows = Array.from(skills).map((skill_id) => ({ vaga_id: vagaRow.id, skill_id }));
        const { error: e2 } = await supabase.from('vaga_skill').insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vagas'] });
      setOpen(false);
      setTitulo('');
      setDescricao('');
      setLocal('');
      setPeriodo('');
      setValor('');
      setSkills(new Set());
    },
  });

  if (!enabled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-terra text-areia text-3xl shadow-lg z-40"
        aria-label="Criar vaga"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-carvao/40 flex items-end z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full bg-areia rounded-t-card p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-terra mb-3">Nova vaga</h3>

            <label className="block text-xs opacity-70 mb-1">Tipo</label>
            <div className="flex gap-2 mb-4">
              {VAGA_TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    tipo === t ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
                  }`}
                >
                  {vagaTipoLabel(t)}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Título (3-80 caracteres)"
              maxLength={80}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            <textarea
              placeholder="Descreva a vaga (10-2000 caracteres)"
              maxLength={2000}
              rows={5}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            <input
              type="text"
              placeholder="Local (opcional)"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            <input
              type="text"
              placeholder="Período (opcional, ex: Sábado 8h-12h)"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            {tipo === 'remunerado' && (
              <input
                type="text"
                placeholder="Valor (opcional, ex: R$ 120/aula)"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
              />
            )}

            <label className="block text-xs opacity-70 mb-1 mt-3">Habilidades requeridas</label>
            <VagaSkillSelector selected={skills} onChange={setSkills} />

            {create.error && (
              <p className="mt-3 text-sm text-terra">{(create.error as Error).message}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-soft border border-carvao/20"
              >
                Cancelar
              </button>
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !titulo.trim() || !descricao.trim()}
                className="flex-1 px-4 py-2 rounded-soft bg-terra text-areia disabled:opacity-50"
              >
                {create.isPending ? 'Publicando…' : 'Publicar vaga'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
