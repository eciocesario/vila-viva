import { Link } from 'react-router-dom';
import { postTipoLabel, type PostTipo } from '@/domain/postTypes';
import { ReactionBar } from '@/components/ReactionBar';
import { CommentList } from '@/components/CommentList';
import { ShareWaButton } from '@/components/ShareWaButton';

export type FeedCardData = {
  id: string;
  tipo: PostTipo;
  titulo: string | null;
  corpo: string;
  created_at: string;
  autor: { id: string; nome: string; perfil_tipo: string };
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
          <Link to={`/profile/${post.autor.id}`} className="font-medium hover:underline">
            {post.autor.nome}
          </Link>
          <span className="mx-1">·</span>
          <span>{post.autor.perfil_tipo}</span>
        </div>
        <span className="text-xs uppercase tracking-wider opacity-50">
          {postTipoLabel(post.tipo)}
        </span>
      </header>
      {post.titulo && (
        <h3 className="font-display text-lg text-carvao mb-2">{post.titulo}</h3>
      )}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.corpo}</p>
      <footer className="mt-3 flex items-center justify-between text-xs opacity-50">
        <span>{new Date(post.created_at).toLocaleString('pt-BR')}</span>
        <ShareWaButton postId={post.id} titulo={post.titulo} autorNome={post.autor.nome} />
      </footer>
      <ReactionBar postId={post.id} />
      <CommentList postId={post.id} />
    </article>
  );
}
