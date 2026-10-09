# ADADI Mobile

The ADADI mobile app for the DUFUHS community, built with Expo, React Native, TypeScript and Expo Router.

## Current foundation

- ADADI burgundy, cream and gold visual system
- Home, Explore, Messages and Account navigation
- Live read-only business directory using the existing Supabase REST API
- Listings limited to approved businesses and 20 results per request
- Search, category filters, loading, empty, error and retry states
- Messaging privacy notice: messages are not end-to-end encrypted

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env`, then set the Supabase URL and publishable key for your project. These are public-client settings; never put a Supabase service-role key or Paystack secret key in the app. Restart Expo after changing environment values.

```bash
npx expo start
```

## Security

Public directory reads are restricted by Supabase Row Level Security. Authentication, customer data, messages, order creation, and payment verification are not implemented in this UI foundation yet. Payment initialization and verification must stay on trusted server routes.

## Bandwidth goal

The target is 3 GB/month combined for the website and app, not a guaranteed cap. The app uses paginated directory requests and only loads images for the currently displayed businesses. We will add carefully scoped caching and image resizing before broader rollout. Order and payment confirmation require a live server check.
