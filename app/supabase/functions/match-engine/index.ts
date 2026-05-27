import { createClient } from '@supabase/supabase-js';

const COMPLEMENTARES: readonly [string, string][] = [
  ['aliado', 'cultivador'],
  ['semente', 'guardiao'],
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function score(eu: { perfil_tipo: string; oferece: Set<string>; busca: Set<string> },
               o:  { perfil_tipo: string; oferece: Set<string>; busca: Set<string> }): number {
  let s = 0;
  if (eu.perfil_tipo === o.perfil_tipo) s += 1;
  if (COMPLEMENTARES.some(([a,b]) => (a===eu.perfil_tipo && b===o.perfil_tipo) || (a===o.perfil_tipo && b===eu.perfil_tipo))) s += 1;
  for (const x of eu.busca) if (o.oferece.has(x)) s += 1;
  for (const x of o.busca) if (eu.oferece.has(x)) s += 1;
  return s;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Body opcional: { perfilFilter?: string, limit?: number, search?: string }
  const body = req.method === 'POST' ? await req.json() : {};
  const limit = Math.min(body.limit ?? 20, 50);

  const { data: meRow } = await supabase
    .from('profile')
    .select('id, perfil_tipo')
    .eq('id', user.id)
    .single();
  if (!meRow) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: meSkills } = await supabase
    .from('profile_skill')
    .select('skill_id, intencao')
    .eq('profile_id', user.id);

  const meOferece = new Set((meSkills ?? []).filter(s => s.intencao === 'oferece').map(s => s.skill_id));
  const meBusca = new Set((meSkills ?? []).filter(s => s.intencao === 'busca').map(s => s.skill_id));

  let query = supabase
    .from('profile')
    .select('id, nome, perfil_tipo, casa, intencao, foto_url')
    .neq('id', user.id)
    .not('onboarding_completed_at', 'is', null);

  if (body.perfilFilter) query = query.eq('perfil_tipo', body.perfilFilter);
  if (body.search) query = query.ilike('nome', `%${body.search}%`);

  const { data: outros, error } = await query.limit(100);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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
      score: score({ perfil_tipo: meRow.perfil_tipo, oferece: meOferece, busca: meBusca },
                   { perfil_tipo: o.perfil_tipo, oferece: s.oferece, busca: s.busca }),
    };
  }).sort((a, b) => b.score - a.score).slice(0, limit);

  return new Response(JSON.stringify(scored), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
