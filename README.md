# Callfolk

Premium internet-first messaging and 1:1 voice calling MVP built with Expo, React Native, TypeScript, Supabase and a LiveKit-ready call boundary.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Authentication requires a configured Supabase project. Apply `supabase/migrations/001_initial.sql` to a new project before enabling registration.

Existing Supabase projects created with the first schema version must also apply `supabase/migrations/002_fix_profile_signup.sql`. It repairs the profile trigger that can otherwise return `Database error saving new user` during registration.

Apply `supabase/migrations/003_contact_request_workflow.sql` to enable friend requests. It adds the protected database functions used to send, accept, and decline requests, and creates mutual contacts only after a request is accepted.

Apply `supabase/migrations/004_core_workflow_fixes.sql` to existing projects. It is an idempotent all-in-one repair for friend requests and direct conversations, including the RLS-safe function required to open a chat.

LiveKit access tokens must be minted by a trusted server or Supabase Edge Function. Never place API secrets in `EXPO_PUBLIC_*` variables.

## Enable real calls

Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` as Supabase Function secrets, then deploy `supabase/functions/livekit-token`. The mobile client uses the LiveKit native SDK automatically; Expo Go is not supported for WebRTC, so create a development build with `npx expo run:android` or `npx expo run:ios`.
