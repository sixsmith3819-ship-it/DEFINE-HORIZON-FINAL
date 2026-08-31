# Environment Configuration Guide

This document describes the environment variables required for the Horizon Business Management System.

## Setup Instructions

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project or select an existing one
3. Navigate to **Settings → API** in your project dashboard
4. Copy the following values into your `.env.local` file:

#### Required Variables

| Variable | Description | How to Find |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous key for client-side operations | Settings → API → Project API keys → Public (anon key) |
| `SUPABASE_SERVICE_KEY` | Service role key for server-side operations | Settings → API → Project API keys → Service role (secret) |

### 3. Enable Email/Password Authentication

In your Supabase project:

1. Go to **Authentication → Providers**
2. Enable **Email/Password** provider
3. **IMPORTANT**: Disable "Confirm email" to allow instant access without verification

### 4. Test the Configuration

```bash
npm run dev
```

Visit `http://localhost:3000` and verify the application loads without authentication errors.

## Security Notes

⚠️ **IMPORTANT SECURITY GUIDELINES:**

- **Never commit `.env.local`** - it's in `.gitignore` for a reason
- **`NEXT_PUBLIC_` prefix**: These variables are exposed to the browser (use for non-sensitive data only)
- **`SUPABASE_SERVICE_KEY`**: Keep this **absolutely secret** - it has full admin permissions
- Store `SUPABASE_SERVICE_KEY` only in `.env.local` (server-side only)
- Never log or expose service keys in error messages
- Rotate keys regularly in Supabase dashboard if compromised

## Development vs Production

### Development (.env.local)
- Use values from your Supabase development project
- Sensitive keys are only in `.env.local`

### Production
- Use a secure environment management system (AWS Secrets Manager, Vercel Environment Variables, etc.)
- Set environment variables through your hosting platform
- Never hardcode credentials

## Troubleshooting

### "Invalid API key" error
- Verify you're using the correct key (anon key for client-side, service key for server-side)
- Check that the URL and keys are from the same Supabase project

### "Email verification required"
- Check Supabase dashboard → Authentication → Providers
- Ensure "Confirm email" is **disabled** for Email/Password provider

### Session not persisting
- Check browser console for errors
- Verify Supabase session cookies are being stored (check DevTools → Application → Cookies)
- Ensure middleware.ts is properly configured

## Environment Variables Reference

```bash
# Example .env.local (fill in with your values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For more information, see [Supabase Documentation](https://supabase.com/docs/guides/auth).
