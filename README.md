# Perth Fireworks Map

An interactive map showing upcoming fireworks events in Perth, Western Australia.

## Features

- View all fireworks events on an interactive map
- Find nearest events to your location
- Filter events by date and search by location
- Automatic daily data updates via Vercel Cron

## Setup

### Environment Variables

Required environment variables for Vercel:

- `OPENAI_API_KEY` - For AI-powered address cleaning and geocoding
- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV REST API Token

### Vercel KV Setup

1. Create a KV database in your Vercel project
2. The KV credentials will be automatically added as environment variables

### Development

```bash
npm install
npm run dev
```

### Deployment

Push to GitHub and import to Vercel. The cron job will automatically update data daily at 2 AM UTC.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Leaflet (maps)
- Vercel Serverless Functions
- Vercel KV (storage)
- OpenAI (data processing)
