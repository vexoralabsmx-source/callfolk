# Callfolk

Premium internet-first messaging and 1:1 voice calling MVP built with Expo, React Native, TypeScript, Supabase and a LiveKit-ready call boundary.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Without environment variables, authentication runs in demo mode so the complete UI flow remains testable. Apply `supabase/migrations/001_initial.sql` to a new Supabase project before enabling real auth.

Existing Supabase projects created with the first schema version must also apply `supabase/migrations/002_fix_profile_signup.sql`. It repairs the profile trigger that can otherwise return `Database error saving new user` during registration.

LiveKit access tokens must be minted by a trusted server or Supabase Edge Function. Never place API secrets in `EXPO_PUBLIC_*` variables.

## Enable real calls

Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` as Supabase Function secrets, then deploy `supabase/functions/livekit-token`. The mobile client uses the LiveKit native SDK automatically; Expo Go is not supported for WebRTC, so create a development build with `npx expo run:android` or `npx expo run:ios`.
