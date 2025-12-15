# Perth Fireworks Map

A fully automated web application that displays fireworks events in Perth, Western Australia on an interactive map. The app automatically scrapes the schedule from WorkSafe WA, uses AI to fix malformed addresses, geocodes them, and displays them on an interactive map.

## Features

- 🗺️ Interactive map showing all fireworks events
- 📍 Find nearest events using your location
- 🔍 Filter events by date range and location
- 📅 View event details including date, time, duration, and location
- 📱 Responsive design for mobile and desktop
- 🤖 AI-powered address fixing for accurate geocoding
- ⚡ Fully automated data updates via Vercel Cron

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key (for address fixing)
- Vercel account (for deployment)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local file
OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the development server:
```bash
npm run dev
```

4. For testing the API endpoints locally, use Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

### Manual Data Updates (Optional)

If you want to manually update the data:

1. Scrape the fireworks schedule:
```bash
npm run scrape
```

2. Geocode the locations:
```bash
npm run geocode
```

## Deployment on Vercel

### Setup Steps

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/thomsopw/perthfireworks.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `CRON_SECRET` (optional) - Secret for securing cron jobs
     - `KV_REST_API_URL` (optional) - Vercel KV REST API URL for caching
     - `KV_REST_API_TOKEN` (optional) - Vercel KV REST API token

3. **Enable Vercel KV (Recommended):**
   - In your Vercel project, go to Storage
   - Create a KV database
   - Add the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables

4. **Configure Cron Job:**
   - The cron job is configured in `vercel.json`
   - It runs daily at 2 AM UTC to update the fireworks data
   - The endpoint `/api/update-data` will be called automatically

### How It Works

1. **Automated Updates:**
   - Vercel Cron calls `/api/update-data` daily at 2 AM UTC
   - The endpoint scrapes WorkSafe WA website
   - Uses AI to fix malformed addresses
   - Geocodes all locations
   - Stores data in Vercel KV (if configured)

2. **Data Serving:**
   - Frontend calls `/api/fireworks-data` to get the latest data
   - Falls back to static file if API is unavailable
   - Data is cached for performance

3. **AI Address Fixing:**
   - Malformed addresses from scraping are fixed using OpenAI
   - Improves geocoding accuracy significantly
   - Handles missing spaces and formatting issues

## API Endpoints

- `GET /api/fireworks-data` - Get all fireworks events (cached)
- `POST /api/update-data` - Update fireworks data (called by cron)
- `POST /api/fix-address` - Fix a single address using AI

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Map Library**: Leaflet with React-Leaflet
- **Styling**: Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **AI**: OpenAI GPT-4o-mini for address fixing
- **Geocoding**: Nominatim (OpenStreetMap)
- **Caching**: Vercel KV (optional)
- **Automation**: Vercel Cron

## Project Structure

```
fireworks-perth/
├── api/
│   ├── fix-address.js          # AI address fixing endpoint
│   ├── update-data.js          # Scraping and geocoding endpoint
│   └── fireworks-data.js       # Data serving endpoint
├── public/
│   └── fireworks-data.json     # Static fallback data
├── scripts/
│   ├── scrape-fireworks.js    # Manual scraping script
│   └── geocode-locations.js    # Manual geocoding script
├── src/
│   ├── components/            # React components
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
└── vercel.json               # Vercel configuration
```

## Environment Variables

- `OPENAI_API_KEY` - Required for AI address fixing
- `CRON_SECRET` - Optional, for securing cron endpoints
- `KV_REST_API_URL` - Optional, for Vercel KV caching
- `KV_REST_API_TOKEN` - Optional, for Vercel KV caching

## License

MIT
