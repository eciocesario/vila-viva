import { createClient } from '@supabase/supabase-js';

const COMPLEMENTARES: readonly [string, string][] = [
  ['tecedor', 'curador'], ['mediador', 'guardian'], ['sonhador', 'praticante'],
  ['aprendiz', 'guia'], ['tradutor', 'semeador'], ['pesquisador', 'comunicador'],
  ['artesao', 'visionario'],
];

function score(eu: { agente: string; oferece: Set<string>; busca: Set<string> },
               o:  { agente: string; oferece: Set<string>; busca: Set<string> }): number {
  let s = 0;
  if (eu.agente === o.agente) s += 1;
  if (COMPLEMENTARES.some(([a,b]) => (a===eu.agente && b===o.agente) || (a===o.agente && b===eu.agente))) s += 1;
  for (const x of eu.busca) if (o.oferece.has(x)) s += 1;
  for (const x of o.busca) if (eu.oferece.has(x)) s += 1;
  return s;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Missing auth', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  // Body opcional: { agenteFilter?: string, limit?: number, search?: string }
  const body = req.method === 'POST' ? await req.json() : {};
  const limit = Math.min(body.limit ?? 20, 50);

  const { data: meRow } = await supabase
    .from('profile')
    .select('id, agente')
    .eq('id', user.id)
    .single();
  if (!meRow) return new Response('Profile not found', { status: 404 });

  const { data: meSkills } = await supabase
    .from('profile_skill')
    .select('skill_id, intencao')
    .eq('profile_id', user.id);

  const meOferece = new Set((meSkills ?? []).filter(s => s.intencao === 'oferece').map(s => s.skill_id));
  const meBusca = new Set((meSkills ?? []).filter(s => s.intencao === 'busca').map(s => s.skill_id));

  let query = supabase
    .from('profile')
    .select('id, nome, agente, casa, intencao, foto_url')
    .neq('id', user.id)
    .not('onboarding_completed_at', 'is', null);

  if (body.agenteFilter) query = query.eq('agente', body.agenteFilter);
  if (body.search) query = query.ilike('nome', `%${body.search}%`);

  const { data: outros, error } = await query.limit(100);
  if (error) return new Response(error.message, { status: 500 });

  const otherIds = (outros ?? []).map(o => o.id);
  const { data: otherSkillsRows } = await supabase
    .from('profile_skill')
    .select('profile_id, skill_id, intencao')
    .in('profile_id', otherIds);

  const skillsByProfile = new Map<string, { oferece: Set<string>; busca: Set<string> }>();
  for (const r of otherSkillsRows ?? []) {
    if (!skillsByProfile.has(r.profile_id))
      skillsByProfile.set(r.profile_id, { oferece: new Set(), busca: new Set() });
    skillsByProfile.get(r.profile_id)![r.intencao as 'oferece'|'busca'].add(r.skill_id);
  }

  const scored = (outros ?? []).map(o => {
    const s = skillsByProfile.get(o.id) ?? { oferece: new Set(), busca: new Set() };
    return {
      ...o,
      score: score({ agente: meRow.agente, oferece: meOferece, busca: meBusca },
                   { agente: o.agente, oferece: s.oferece, busca: s.busca }),
    };
  }).sort((a, b) => b.score - a.score).slice(0, limit);

  return new Response(JSON.stringify(scored), {
    headers: { 'Content-Type': 'application/json' },
  });
});
