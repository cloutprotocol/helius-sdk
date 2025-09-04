# PumpLoss Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cloutprotocol/helius-sdk)

## Manual Deployment Steps

### 1. Prerequisites

- Vercel account
- GitHub repository with your PumpLoss code
- Environment variables ready

### 2. Environment Variables

Set these in your Vercel dashboard (Project Settings → Environment Variables):

```bash
# Required
HELIUS_API_KEY=your_helius_api_key_here
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key
PUMPSWAP_PROGRAM_ID=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P

# Convex (if using)
CONVEX_DEPLOYMENT=your_convex_deployment_url
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4. Deploy via GitHub Integration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 5. Build Configuration

The project includes a `vercel.json` file with optimal settings:

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 6. Domain Configuration

After deployment:

1. Go to Project Settings → Domains
2. Add your custom domain (optional)
3. Configure DNS records as instructed

### 7. Monitoring & Analytics

Enable in Vercel dashboard:
- **Analytics**: Track page views and performance
- **Speed Insights**: Monitor Core Web Vitals
- **Logs**: Debug deployment and runtime issues

## Troubleshooting

### Common Issues

1. **Build Fails**: Check environment variables are set
2. **API Routes 404**: Ensure files are in `src/app/api/` directory
3. **Static Assets Missing**: Check `public/` directory exists

### Build Logs

Check build logs in Vercel dashboard:
- Go to Deployments tab
- Click on failed deployment
- Review build logs for errors

### Environment Variables

Verify all required environment variables are set:
```bash
vercel env ls
```

## Performance Optimization

### Recommended Settings

1. **Enable Edge Runtime** for API routes when possible
2. **Use ISR** (Incremental Static Regeneration) for data that changes infrequently
3. **Optimize images** with Next.js Image component
4. **Enable compression** in next.config.js

### Monitoring

Set up monitoring:
- Vercel Analytics for user metrics
- Sentry for error tracking
- Custom monitoring for Solana RPC calls

## Security

### Environment Variables
- Never commit `.env` files
- Use Vercel's encrypted environment variables
- Rotate API keys regularly

### API Security
- Implement rate limiting
- Validate all inputs
- Use CORS appropriately

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [PumpLoss GitHub Issues](https://github.com/cloutprotocol/helius-sdk/issues)