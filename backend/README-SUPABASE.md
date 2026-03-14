# Supabase Auth Migration

This dashboard has been migrated from Clerk to Supabase Auth.

## Setup

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Install dependencies:
```bash
npm install
```

4. Run dev server:
```bash
npm run dev
```

## Auth Architecture

- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/server.ts` — Server client (RSC/Route Handlers)
- `src/lib/supabase/middleware.ts` — Session refresh + route protection
- `src/context/auth-context.tsx` — React context with user/org/role state
- `src/features/auth/components/sign-in-form.tsx` — Sign in form (email/password)
- `src/features/auth/components/sign-up-form.tsx` — Sign up form

## RBAC

Roles are stored in `user_metadata.organizations` array. Each membership has:
- `organization: { id, name, image_url }`
- `role: "admin" | "member" | "viewer"`

Permissions are derived from roles in `auth-context.tsx`.

## Protected Routes

Middleware redirects:
- `/dashboard/*` → `/auth/sign-in` if not authenticated
- `/auth/*` → `/dashboard/overview` if already authenticated
