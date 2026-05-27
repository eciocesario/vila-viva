import { Link } from 'react-router-dom';
import { track } from '@/lib/posthog';

export type MatchResult = {
  id: string;
  nome: string;
  perfil_tipo: string;
  casa: string | null;
  intencao: string | null;
  score: number;
};

export function MatchCard({ m }: { m: MatchResult }) {
  return (
    <Link
      to={`/profile/${m.id}`}
      onClick={() => track('match_clicked', { profile_id: m.id })}
      className="block p-4 rounded-card bg-white border border-carvao/10 hover:border-mata"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg text-terra">{m.nome}</h3>
        <span className="text-xs opacity-50">score {m.score}</span>
      </div>
      <p className="text-xs opacity-70">{m.perfil_tipo}{m.casa ? ` · ${m.casa}` : ''}</p>
      {m.intencao && <p className="text-sm mt-2 italic">{m.intencao}</p>}
    </Link>
  );
}
