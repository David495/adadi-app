# ADADI Mobile

The ADADI mobile app for the DUFUHS community, built with Expo, React Native, TypeScript and Expo Router.

## Current foundation

- ADADI burgundy, cream and gold visual system
- Home, Explore, Messages and Account navigation
- Mobile-first layouts with accessible controls
- Search input and category navigation foundation
- Messaging privacy notice: messages are not end-to-end encrypted
- Supabase and Paystack integrations are intentionally not wired into the starter UI yet

## Run locally

```bash
npm install
npx expo start
```

## Configuration and security

The app will use the existing ADADI Supabase project through its public/publishable client key and Row Level Security. Never place a Supabase service-role key or Paystack secret key in the mobile app. Payment initialization and verification must stay on trusted server routes.

## Bandwidth goal

The target is 3 GB/month combined for the website and app, not a guaranteed cap. The app will use paginated queries, minimal refetching, image resizing/compression, and cache-first browsing where appropriate. Order and payment confirmation require a live server check.
