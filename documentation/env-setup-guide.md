# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# TickFlow - Environment Variables

# ==================================
# Next.js Configuration
# ==================================
NODE_ENV=development

# ==================================
# Supabase Configuration
# ==================================
# Your Supabase project URL (found in Supabase Dashboard -> Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase service role key (found in Supabase Dashboard -> Settings -> API)
# WARNING: Keep this secret! Never commit this to version control
# This key has full access to your database
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Supabase anon/public key (optional, for client-side usage)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ==================================
# Authentication & Security
# ==================================
# Secret key for signing JWT tokens
# Generate a secure random string (minimum 32 characters recommended)
# Example generation: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ==================================
# Rate Limiting (Optional)
# ==================================
# Maximum login attempts per minute (default: 5)
# RATE_LIMIT_MAX_REQUESTS=5

# Rate limit window in milliseconds (default: 60000 = 1 minute)
# RATE_LIMIT_WINDOW=60000

# ==================================
# Application Settings (Optional)
# ==================================
# Base URL of your application (used for callbacks, emails, etc.)
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Get Supabase Credentials

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role (secret)** → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon (public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## How to Generate JWT_SECRET

### Option 1: Using OpenSSL (Recommended)
```bash
openssl rand -base64 32
```

### Option 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Using Online Generator
Visit: https://generate-secret.vercel.app/32

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - Already included in `.gitignore`
   
2. **Use different secrets for different environments**
   - Development, Staging, Production should have unique `JWT_SECRET` values

3. **Rotate secrets regularly**
   - Change `JWT_SECRET` periodically
   - Update in production environment variables

4. **Service Role Key Protection**
   - Only use `SUPABASE_SERVICE_ROLE_KEY` in server-side code
   - Never expose it to the client/browser

## Environment-Specific Configuration

### Development (`.env.local`)
```bash
NODE_ENV=development
JWT_SECRET=dev-secret-key-not-for-production
```

### Production (Vercel/Platform Environment Variables)
- Set via platform dashboard
- Use strong, unique secrets
- Enable encryption at rest if available

