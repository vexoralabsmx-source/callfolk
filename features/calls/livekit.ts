const livekitUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL;

export type CallCredentials = { serverUrl: string; token: string; roomName: string };

export async function requestCallCredentials(calleeId: string, accessToken: string): Promise<CallCredentials> {
  if (!livekitUrl) throw new Error('LiveKit is not configured');
  const apiUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const response = await fetch(`${apiUrl}/functions/v1/livekit-token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ calleeId }),
  });
  if (!response.ok) throw new Error('Unable to join call');
  return response.json() as Promise<CallCredentials>;
}
