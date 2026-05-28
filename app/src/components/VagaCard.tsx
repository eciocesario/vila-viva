import { Link } from 'react-router-dom';
import { vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';

export type VagaCardData = {
  id: string;
  tipo: VagaTipo;
  titulo: string;
  count_interesses: number;
  created_at: string;
  autor: { id: string; nome: string; perfil_tipo: string };
  skills?: { rotulo: string }[];
};

const TIPO_BG: Record<VagaTipo, string> = {
  voluntariado: 'bg-mata/10',
  remunerado: 'bg-yellow-100',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`;
  return `há ${Math.floor(days / 30)} meses`;
}

export function VagaCard({ vaga }: { vaga: VagaCardData }) {
  return (
    <Link
      to={`/vagas/${vaga.id}`}
      className={`block p-4 rounded-card border border-carvao/10 hover:border-mata ${TIPO_BG[vaga.tipo]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider opacity-60">
          {vagaTipoLabel(vaga.tipo)}
        </span>
        <span className="text-xs opacity-50">{timeAgo(vaga.created_at)}</span>
      </div>
      <h3 className="font-display text-lg text-terra mb-1">{vaga.titulo}</h3>
      <p className="text-xs opacity-70 mb-2">
        {vaga.autor.nome} · {PERFIL_LABELS[vaga.autor.perfil_tipo as Perfil] ?? vaga.autor.perfil_tipo}
      </p>
      {vaga.skills && vaga.skills.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {vaga.skills.slice(0, 3).map((s) => (
            <span key={s.rotulo} className="px-2 py-0.5 rounded-full bg-white text-xs">
              {s.rotulo}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs opacity-60">{vaga.count_interesses} interessado(s)</p>
    </Link>
  );
}
