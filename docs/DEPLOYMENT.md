# Motor Auto Care CRM – Deployment Guide

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- CockroachDB or PostgreSQL database
- Clerk account
- OpenRouter API key (for AI features)

## 1. Database (CockroachDB / PostgreSQL)

1. Create a CockroachDB cluster (or use any PostgreSQL 12+ instance).
2. Create a database, e.g. `motor_auto_care`.
3. Set the connection string in your environment:

```env
DATABASE_URL="postgresql://user:password@host:26257/motor_auto_care?sslmode=require"
```

4. Run migrations and seed:

```bash
pnpm db:generate
pnpm db:migrate   # or: pnpm prisma migrate deploy (production)
pnpm db:seed       # optional: seed roles and sample data
```

## 2. Clerk

1. Create an application at [clerk.com](https://clerk.com).
2. Add environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

3. In Clerk Dashboard, set the same redirect URLs for your production domain.

## 3. OpenRouter (AI)

1. Get an API key from [openrouter.ai](https://openrouter.ai).
2. Add to env:

```env
OPENROUTER_API_KEY=sk-or-...
```

The app uses free models by default (e.g. `meta-llama/llama-3.2-3b-instruct:free`).

## 4. File uploads (optional)

For job card images, use [UploadThing](https://uploadthing.com) or S3:

```env
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...
```

Or configure S3-compatible storage and set the corresponding env vars in your upload implementation.

## 5. Deploy to Vercel

1. Push the repo to GitHub and import the project in Vercel.
2. Add all environment variables in Vercel Project Settings → Environment Variables.
3. For the build to run Prisma:

   - Ensure `DATABASE_URL` is set.
   - Add a build script or use `prisma generate` in `package.json` `build` (Next.js runs it if Prisma is a dependency).

4. After deployment, run migrations against the production DB:

```bash
DATABASE_URL="your-production-url" pnpm prisma migrate deploy
```

5. Optionally run the seed once:

```bash
DATABASE_URL="your-production-url" pnpm db:seed
```

## 6. Post-deploy

- Create at least one user via Clerk sign-up.
- Optionally sync Clerk users to the app `User` table (e.g. via webhook or on first login) and assign a `Role` (Admin/Manager/Technician) for RBAC.
- Configure Garage Settings (garage name, tax rate) from the Settings page or seed.

## Audit & migration notes (March 2026)

This project was audited for **March 2026** best practices. Main updates:

- **Next.js:** The deprecated `middleware` convention was replaced with **proxy** (`proxy.ts`). See [Next.js – Migration to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy).
- **Vercel AI SDK:** The chat API and AI chat UI were updated to use **UI message streaming** (`toUIMessageStreamResponse`, `convertToModelMessages`) and the **transport-based useChat** API (manual input state, `sendMessage`, `DefaultChatTransport`). See `docs/AUDIT-MARCH-2026.md` for details.

For a full list of outdated patterns, fixes, and migration steps, see **`docs/AUDIT-MARCH-2026.md`**.

---

## Scripts reference

| Script        | Description                |
|---------------|----------------------------|
| `pnpm dev`    | Start dev server            |
| `pnpm build`  | Build for production        |
| `pnpm start`  | Start production server     |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate`  | Run migrations (dev)   |
| `pnpm db:push`     | Push schema (dev)      |
| `pnpm db:seed`     | Run seed script        |
| `pnpm db:studio`   | Open Prisma Studio     |
