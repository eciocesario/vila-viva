import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';

export function CommentList({ postId }: { postId: string }) {
  const { session } = useAuth();
  const enabled = useFlag('comments');
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment')
        .select('id, corpo, created_at, autor:profile!autor_id(nome)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const post = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('comment').insert({
        post_id: postId,
        autor_id: session!.user.id,
        corpo: draft.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  if (!enabled) return null;

  return (
    <div className="mt-3 border-t border-carvao/10 pt-3">
      {comments && comments.length > 0 && (
        <ul className="space-y-2 mb-2">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{(c.autor as { nome: string }).nome}: </span>
              <span>{c.corpo}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Comentar…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 px-3 py-2 rounded-soft border border-carvao/20 bg-white text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) post.mutate(); }}
        />
        <button
          onClick={() => post.mutate()}
          disabled={!draft.trim() || post.isPending}
          className="px-3 py-2 rounded-soft bg-terra text-areia text-sm disabled:opacity-50"
        >Enviar</button>
      </div>
    </div>
  );
}
