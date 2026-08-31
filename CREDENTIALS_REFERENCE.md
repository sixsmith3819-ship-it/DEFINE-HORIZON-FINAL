# Credentials Reference Guide for Wave 2

This guide explains what each credential is, where to find it, and what it's used for.

---

## Overview of Supabase Credentials

You need three credentials to connect your Next.js app to Supabase:

| Variable | Visibility | Purpose | Where to Use |
|----------|-----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 🟢 Public | Supabase API endpoint URL | Browser client code |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🟢 Public | Anonymous/public API key for browser | Browser client code |
| `SUPABASE_SERVICE_KEY` | 🔴 Secret | Server-side secret key (admin) | .env.local only |

---

## Finding Your Credentials in Supabase

### Step 1: Open Settings → API

1. Login to your Supabase dashboard
2. Click on your project name in the left sidebar
3. Click **Settings** (gear icon) in the bottom left
4. Click **API** in the left menu

You'll see a page showing your API configuration.

---

## Credential 1: NEXT_PUBLIC_SUPABASE_URL

### What it is
The REST API endpoint URL for your Supabase project.

### Where to find it
- In **Settings → API** page
- Look for section labeled **"API URL"** or **"Project URL"**
- Value starts with: `https://`

### What it looks like
```
https://your-project-id.supabase.co
```

### How to copy it
1. Look for the input field with your URL
2. Click the **copy icon** next to it (or select and copy manually)
3. Paste into `.env.local` as the value for `NEXT_PUBLIC_SUPABASE_URL`

### Where it's used
- Browser client connections
- API calls from React components
- Data fetching operations on the client side

### Is it public?
**YES** - It's safe to have in your code and on the frontend. The URL itself doesn't grant access; the API key controls permissions.

---

## Credential 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

### What it is
The public/anonymous API key that allows browser clients to connect to Supabase with limited permissions (determined by RLS policies).

### Where to find it
- In **Settings → API** page
- Look for section labeled **"Project API keys"**
- Under **"anon"** (public) key
- It's the first key listed, marked as "public"

### What it looks like
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV...
```
(Long JWT-like string starting with `ey`)

### How to copy it
1. In the **Project API keys** section, find the row with:
   - Name: `anon`
   - Visibility: `public`
2. Click the **copy icon** on the right of that row
3. Paste into `.env.local` as the value for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Where it's used
- Browser client connections to Supabase
- React component data fetching
- Client-side authentication

### Is it public?
**YES** - This key is meant to be public. It only has the permissions defined by your RLS policies, so even if exposed, it can't access restricted data.

### Security note
- The anon key is limited by RLS policies you configured in Task 6
- Each user can only access their own profile due to the "Users can read own profile" policy
- Never try to hide this key; it's meant to be public

---

## Credential 3: SUPABASE_SERVICE_KEY

### What it is
The secret/service role API key with admin permissions. Used by your Next.js server for operations that bypass RLS policies.

### Where to find it
- In **Settings → API** page
- Look for section labeled **"Project API keys"**
- Under **"service_role"** (secret) key
- It's usually the second key listed, marked as "secret"

### What it looks like
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV...
```
(Similar format to anon key, but different token)

### How to copy it
1. In the **Project API keys** section, find the row with:
   - Name: `service_role`
   - Visibility: `secret` or 🔒
2. Click the **copy icon** on the right of that row
3. Paste into `.env.local` as the value for `SUPABASE_SERVICE_KEY`

### Where it's used
- Next.js API routes (server-side only)
- Middleware (server-side only)
- **NEVER** in browser code
- Administrative operations that need to bypass RLS

### Is it public?
**NO** - This is a secret key. Keep it secure:
- ✅ Store in `.env.local` (which is in `.gitignore`)
- ✅ Never commit to git
- ✅ Never expose in logs or error messages
- ✅ Only use in server-side code
- ❌ Never put in browser code
- ❌ Never share publicly

### Security note
- The service role key has full database access
- It's used by your Next.js backend to perform administrative tasks
- If exposed, regenerate it in Supabase settings

---

## Example .env.local File

```
# DEVELOPMENT ENVIRONMENT VARIABLES
# Copy values from Supabase Settings → API

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF...
```

---

## How Credentials Are Used in Your App

### In Browser (Client-Side)
```typescript
// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,      // ← Public URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ← Public key
  )
```

### In Next.js Server (API Routes, Middleware)
```typescript
// middleware.ts or app/api/route.ts
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  // ← Public URL
  process.env.SUPABASE_SERVICE_KEY!       // ← Secret key (server only)
)
```

---

## Refreshing Credentials (If Compromised)

### If NEXT_PUBLIC_SUPABASE_ANON_KEY is exposed:

1. Go to **Settings → API**
2. Click the 🔄 icon next to the anon key
3. Click "Regenerate"
4. Update `.env.local` with new key
5. Restart dev server

### If SUPABASE_SERVICE_KEY is exposed:

1. Go to **Settings → API**
2. Click the 🔄 icon next to the service_role key
3. Click "Regenerate"
4. Update `.env.local` with new key
5. Restart dev server
6. ⚠️ Alert your team that the secret was exposed

### If NEXT_PUBLIC_SUPABASE_URL is exposed:

- No action needed - URLs aren't secrets and can be public
- This URL is only useful with a valid API key

---

## Troubleshooting Credentials

### Problem: "Invalid API Key" error

**Causes:**
- Key not correctly copied from Supabase
- Extra spaces or line breaks in `.env.local`
- Wrong key (e.g., using service_role in browser code)

**Solutions:**
1. Re-copy credentials directly from Supabase Settings → API
2. Remove any extra spaces in `.env.local`
3. Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is used in browser, not service role key
4. Restart dev server after updating `.env.local`

### Problem: "Connection refused" error

**Causes:**
- Wrong or incomplete URL
- Typo in `NEXT_PUBLIC_SUPABASE_URL`
- Supabase project is paused

**Solutions:**
1. Verify URL matches exactly: `https://your-project-id.supabase.co`
2. No trailing slashes or extra characters
3. Check Supabase project status in dashboard
4. Unpause project if paused

### Problem: "Row-level security violation" error

**Causes:**
- Using wrong credentials
- RLS policies are working correctly but denying access
- Browser client trying to access another user's data

**Solutions:**
- This is expected behavior - RLS is protecting data
- Use service_role key on server-side for admin operations
- Browser client should only see user's own data (via RLS)

### Problem: "Secrets must not contain newlines" error

**Causes:**
- `.env.local` file has line breaks within credential values
- Copy/paste error created multi-line value

**Solutions:**
1. Open `.env.local` in text editor
2. Verify each credential is on a single line
3. Remove any newlines within values
4. Save file
5. Restart dev server

---

## Security Best Practices

✅ **DO:**
- Store `.env.local` in `.gitignore` (already done)
- Keep `SUPABASE_SERVICE_KEY` secure and secret
- Regularly rotate keys if you suspect exposure
- Use different projects for dev, staging, and production
- Monitor API usage in Supabase dashboard

❌ **DON'T:**
- Commit `.env.local` to git
- Share `SUPABASE_SERVICE_KEY` via email or chat
- Log credentials in error messages
- Use the same keys across different projects
- Store credentials in browser local storage
- Hardcode credentials in source code

---

## Next Steps

1. Copy your three credentials from Supabase Settings → API
2. Fill in `.env.local` with the correct values
3. Save the file
4. Restart your dev server: `npm run dev`
5. Proceed to Phase 3 (Creating client utilities)

---

## Reference Links

- [Supabase API Documentation](https://supabase.com/docs/reference/api)
- [Environment Variables Guide](https://supabase.com/docs/guides/local-development#environment-variables)
- [Row-Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security)

