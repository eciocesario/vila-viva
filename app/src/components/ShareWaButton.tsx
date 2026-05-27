import { useFlag } from '@/lib/useFlag';
import { track } from '@/lib/posthog';

export function ShareWaButton({ postId, titulo, autorNome }: { postId: string; titulo: string | null; autorNome: string }) {
  const enabled = useFlag('share_wa');
  if (!enabled) return null;

  const url = `${window.location.origin}/post/${postId}`;
  const text = `${titulo ? `"${titulo}" — ` : ''}post de ${autorNome} na Vila Viva: ${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('share_wa_clicked', { post_id: postId })}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mata/10 text-mata"
    >
      Compartilhar no WhatsApp
    </a>
  );
}
