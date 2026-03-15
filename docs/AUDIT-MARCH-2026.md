# Deep Audit & Update – March 2026

This document records the technical audit performed to align the Motor Auto Care CRM with **latest official documentation and best practices as of March 2026**.

---

## 1. Outdated patterns found and fixes

### Next.js: middleware → proxy

| Item | Why outdated | Update |
|------|----------------|--------|
| `middleware.ts` with `export default clerkMiddleware(...)` | Next.js deprecated the `middleware` file convention and renamed it to **proxy** to avoid confusion with Express middleware and to clarify the feature’s role (network boundary in front of the app). | **Done.** Replaced with `proxy.ts`: export a single function named `proxy(request: NextRequest)` that invokes Clerk’s handler. Deleted `middleware.ts`. |

**Reference:** [Next.js – Migration to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy), [Proxy file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).

**Files changed:**
- **Added:** `proxy.ts` – exports `proxy(request)` and calls `clerkHandler(request)` (Clerk’s middleware).
- **Removed:** `middleware.ts`.

---

### Vercel AI SDK: chat route and useChat (v5+)

| Item | Why outdated | Update |
|------|----------------|--------|
| `streamText` + `toDataStreamResponse()` | For UI-based chat, the SDK expects a **UI message stream**. `toDataStreamResponse()` is a lower-level format; useChat is designed to consume `toUIMessageStreamResponse()`. | **Done.** Chat route now uses `convertToModelMessages(messages)` for the request body and returns `result.toUIMessageStreamResponse()`. |
| Request body passed directly as `messages` to `streamText` | useChat sends **UIMessage** objects (e.g. with `parts`). `streamText` expects **ModelMessage**. Conversion is required. | **Done.** Import `convertToModelMessages` from `ai` and pass `await convertToModelMessages(messages)` into `streamText`. |
| useChat with `input`, `handleInputChange`, `handleSubmit` | In AI SDK 5.0+, useChat uses a **transport-based** API and **no longer manages input state**. Relying on built-in `input` / `handleInputChange` / `handleSubmit` is legacy. | **Done.** AI chat component now uses `useState` for `input`, `sendMessage({ text })` to submit, and `transport: new DefaultChatTransport({ api: '/api/chat' })`. Message content is read from `message.parts` or `message.content` (UIMessage shape). |

**References:**  
[AI SDK – streamText](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text), [useChat](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat), [Migration guide 5.0 – useChat](https://sdk.vercel.ai/docs/migration-guides/migration-guide-5-0).

**Files changed:**
- **`app/api/chat/route.ts`:** `convertToModelMessages(messages)`, `result.toUIMessageStreamResponse()`.
- **`app/(dashboard)/ai/ai-chat.tsx`:** Manual input state, `DefaultChatTransport`, `sendMessage({ text })`, `status`, and a small helper to get text from UIMessage (`getMessageText`).

---

### Other dependencies (verified, no code changes)

- **Prisma:** Current usage (schema, singleton client, migrations, CockroachDB URL) matches current Prisma + Next.js patterns. No Prisma 7–specific config (e.g. `prisma.config.ts`) was introduced to avoid breaking the existing setup.
- **Clerk:** `clerkMiddleware`, `createRouteMatcher`, `auth.protect()` are still the recommended approach; they are now invoked from `proxy.ts` instead of `middleware.ts`.
- **Zod / React Hook Form / shadcn:** Used as per current docs; no deprecated APIs detected.
- **TailwindCSS v4:** Project already uses `@import "tailwindcss"` and `@theme`; no change.

---

## 2. Dependency versions (post-audit)

No dependency version bumps were required for this audit. The project already uses:

- Next.js 16.x
- React 19.x
- Prisma 7.x
- Clerk 7.x
- AI SDK 6.x / @ai-sdk/react
- TailwindCSS 4.x

---

## 3. Migration notes for each major change

### Migrating from middleware to proxy

1. Rename `middleware.ts` → `proxy.ts` (or add `proxy.ts` and remove `middleware.ts`).
2. Export a function named `proxy` (or default export) that receives `NextRequest`.
3. If you use Clerk, keep using `clerkMiddleware()` but call the function it returns from inside `proxy`, e.g.:

   ```ts
   const clerkHandler = clerkMiddleware(async (auth, request) => { ... });
   export function proxy(request: NextRequest) {
     return clerkHandler(request);
   }
   ```

4. Keep the same `config.matcher` (if any).
5. Run the official codemod if you prefer:  
   `npx @next/codemod@canary middleware-to-proxy .`

### Migrating the AI chat (API + client)

1. **Server (`/api/chat`):**
   - Parse body: `const { messages } = await req.json()`.
   - Convert: `const modelMessages = await convertToModelMessages(messages)`.
   - Call: `streamText({ ..., messages: modelMessages })`.
   - Return: `result.toUIMessageStreamResponse()`.

2. **Client (useChat):**
   - Use a transport: `transport: new DefaultChatTransport({ api: '/api/chat' })`.
   - Manage input with `useState`.
   - On submit: `sendMessage({ text: input })` then clear input.
   - Use `status` (e.g. `"streaming"` / `"submitted"`) instead of `isLoading` if needed.
   - Read assistant text from UIMessage `parts` or `content` (depending on SDK version).

---

## 4. Security and performance

- **Auth:** Unchanged. Protection is still enforced via Clerk inside the new proxy; no public routes were expanded.
- **Performance:** No intentional change to server/client split; AI chat remains the main client-heavy surface. Server components and existing patterns are unchanged.

---

## 5. Result

The codebase is now:

- Aligned with **Next.js proxy** instead of deprecated middleware.
- Using **AI SDK UI message stream** and **useChat v5+** patterns (transport, manual input, `sendMessage`, `toUIMessageStreamResponse`).
- Documented for future upgrades (Clerk, Prisma, AI SDK).
- Ready for production use with the same security and feature set as before the audit.
