# Vercel Deployment Guide

## Quick Start

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import your GitHub repository**: `thomsopw/perthfireworks`
4. **Configure the project:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

### Required:
- `OPENAI_API_KEY` - Your OpenAI API key (get one at https://platform.openai.com/api-keys)

### Optional (but recommended):
- `CRON_SECRET` - A random secret string to secure your cron endpoint (e.g., generate with `openssl rand -hex 32`)
- `KV_REST_API_URL` - Vercel KV REST API URL (if using KV for caching)
- `KV_REST_API_TOKEN` - Vercel KV REST API token (if using KV for caching)

## Setting Up Vercel KV (Optional but Recommended)

1. In your Vercel project dashboard, go to **Storage**
2. Click **Create Database** → Select **KV**
3. Give it a name (e.g., "fireworks-cache")
4. After creation, go to the database settings
5. Copy the `KV_REST_API_URL` and `KV_REST_API_TOKEN`
6. Add them as environment variables in your project

## Cron Job Configuration

The cron job is already configured in `vercel.json` to run daily at 2 AM UTC. It will:
- Scrape the WorkSafe WA website
- Fix addresses using AI
- Geocode all locations
- Store the data in Vercel KV (if configured)

The cron endpoint is: `/api/update-data`

## Testing the Deployment

After deployment:

1. **Test the API endpoints:**
   - `https://your-project.vercel.app/api/fireworks-data` - Should return fireworks data
   - `https://your-project.vercel.app/api/fix-address` - Test with POST request

2. **Manually trigger data update:**
   ```bash
   curl -X POST https://your-project.vercel.app/api/update-data \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Check cron job logs:**
   - Go to your Vercel project → Functions → View logs
   - Check for cron job executions

## Troubleshooting

### Cron job not running?
- Check that `vercel.json` has the cron configuration
- Verify the cron schedule is correct
- Check Vercel project settings → Cron Jobs

### API endpoints returning errors?
- Check environment variables are set correctly
- Check function logs in Vercel dashboard
- Verify OpenAI API key is valid

### Data not updating?
- Check cron job logs
- Manually trigger the update endpoint
- Verify KV storage is set up (if using)

## Cost Considerations

- **OpenAI API**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
  - With ~12 events, each address fix uses ~200 tokens
  - Daily cost: ~$0.001 (very cheap)
- **Vercel**: Free tier includes 100GB bandwidth, 100 serverless function executions per day
- **Vercel KV**: Free tier includes 256MB storage, 30M reads/day, 30M writes/day

## Next Steps

1. Deploy to Vercel
2. Set environment variables
3. (Optional) Set up Vercel KV
4. Test the endpoints
5. Monitor the first cron job execution
6. Share your live site! 🎉

