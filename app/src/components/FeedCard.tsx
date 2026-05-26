import { postTipoLabel, type PostTipo } from '@/domain/postTypes';

export type FeedCardData = {
  id: string;
  tipo: PostTipo;
  titulo: string | null;
  corpo: string;
  created_at: string;
  autor: { id: string; nome: string; agente: string };
};

const TIPO_COLOR: Record<PostTipo, string> = {
  historia: 'bg-areia',
  pedido: 'bg-terra/10',
  projeto: 'bg-mata/10',
  evento: 'bg-yellow-100',
  conquista: 'bg-amber-200',
};

export function FeedCard({ post }: { post: FeedCardData }) {
  return (
    <article className={`${TIPO_COLOR[post.tipo]} rounded-card p-5 border border-carvao/10`}>
      <header className="flex items-center justify-between mb-2">
        <div className="text-xs opacity-60">
          <span className="font-medium">{post.autor.nome}</span>
          <span className="mx-1">·</span>
          <span>{post.autor.agente}</span>
        </div>
        <span className="text-xs uppercase tracking-wider opacity-50">
          {postTipoLabel(post.tipo)}
        </span>
      </header>
      {post.titulo && (
        <h3 className="font-display text-lg text-carvao mb-2">{post.titulo}</h3>
      )}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.corpo}</p>
      <footer className="mt-3 text-xs opacity-50">
        {new Date(post.created_at).toLocaleString('pt-BR')}
      </footer>
    </article>
  );
}
