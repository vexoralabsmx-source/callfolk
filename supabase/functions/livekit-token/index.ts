import { createClient } from 'npm:@supabase/supabase-js@2';
import { AccessToken } from 'npm:livekit-server-sdk@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(authorization.slice(7));
    if (userError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors });

    const { calleeId } = await request.json() as { calleeId?: string };
    if (!calleeId || calleeId === user.id) return Response.json({ error: 'Invalid callee' }, { status: 400, headers: cors });

    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase.from('calls').select('*', { count: 'exact', head: true }).eq('caller_id', user.id).gte('started_at', since);
    if ((count ?? 0) >= 8) return Response.json({ error: 'Too many call attempts' }, { status: 429, headers: cors });

    const { data: blocked } = await supabase.from('blocked_users').select('blocker_id').or(`and(blocker_id.eq.${calleeId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${calleeId})`).limit(1);
    if (blocked?.length) return Response.json({ error: 'Call unavailable' }, { status: 403, headers: cors });

    const roomName = `call_${crypto.randomUUID()}`;
    const { error: callError } = await supabase.from('calls').insert({ caller_id: user.id, callee_id: calleeId, room_name: roomName });
    if (callError) throw callError;

    const token = new AccessToken(
      Deno.env.get('LIVEKIT_API_KEY')!,
      Deno.env.get('LIVEKIT_API_SECRET')!,
      { identity: user.id, ttl: '10m' },
    );
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    return Response.json(
      { serverUrl: Deno.env.get('LIVEKIT_URL'), token: await token.toJwt(), roomName },
      { headers: { ...cors, 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'Unable to create call' }, { status: 500, headers: cors });
  }
});
