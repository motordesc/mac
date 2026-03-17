# 🏎️ Motor Auto Care (MAC) CRM

### Premium AI-Powered Workshop Management System
**Built for the future (March 2026 Standard) with Next.js 16, React 19, and Vercel AI SDK 6.**

Motor Auto Care (MAC) CRM is a state-of-the-art workshop management platform designed for modern automotive service centers. It combines high-performance ALPR (Automatic License Plate Recognition), intelligent business analytics through OpenRouter AI, and a robust multi-branch architecture to streamline garage operations.

---

## 🌟 Key Features

### 📡 AI Vehicle Scanner (ANPR)
*   **Auto-Detection:** Real-time number plate identification using the camera.
*   **Indian Plate Optimized:** Fine-tuned for Indian registration formats with high accuracy.
*   **Consensus Mechanism:** Multi-frame validation ensures the scan is correct before redirection.
*   **Seamless Intake:** Automatically looks up existing customers/vehicles or starts a new job card.

### 🤖 Intelligent Business Assistant
*   **OpenRouter Integration:** Leverage top-tier models like Gemini 2.5 Flash and DeepSeek v3.
*   **Financial Insights:** Real-time analysis of revenue, unpaid invoices, and technician performance.
*   **Inventory Alerts:** Proactive notifications for low-stock items.

### 🏢 Multi-Branch Architecture
*   **Isolated Data:** Securely manage multiple locations with branch-specific staff, inventory, and financials.
*   **Global Dashboard:** Admins can view aggregated metrics across the entire organization.
*   **Permission-Based Access:** Role-based access control (RBAC) for Admins, Managers, and Technicians.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js 16 (App Router)](https://nextjs.org) with **Proxy Architecture**
*   **Runtime:** [React 19](https://react.dev)
*   **Database:** [CockroachDB](https://www.cockroachlabs.com/) (Serverless PostgreSQL)
*   **ORM:** [Prisma 7](https://www.prisma.io/)
*   **Authentication:** [Clerk 7](https://clerk.com/)
*   **AI Engine:** [Vercel AI SDK 6](https://sdk.vercel.ai/) via [OpenRouter](https://openrouter.ai/)
*   **OCR:** [Plate Recognizer Snapshot API](https://platerecognizer.com/)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
*   **PDF Generation:** [@react-pdf/renderer](https://react-pdf.org/)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following accounts/keys:
*   **Node.js 20+** and **pnpm** installed.
*   **CockroachDB:** A free serverless cluster.
*   **Clerk:** An application for authentication.
*   **OpenRouter:** An API key for AI features.
*   **Plate Recognizer:** An API token for the vehicle scanner.

### 2. Installation
```bash
git clone https://github.com/your-username/crmmac.git
cd crmmac
pnpm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and populate it:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI & OCR
OPENROUTER_API_KEY=sk-or-v1-...
PLATE_RECOGNIZER_API_KEY=your_token_here

# App Config
SUPER_ADMIN_EMAIL=your-email@example.com
```

### 4. Database Setup
```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to CockroachDB
pnpm db:seed      # Seed initial roles and garage settings
```

---

## 📷 API Setup: Plate Recognizer (OCR)

The vehicle scanner uses Plate Recognizer for high-speed, accurate ALPR.

1.  **Sign Up:** Go to [platerecognizer.com](https://platerecognizer.com/) and create an account.
2.  **Get Token:** Navigate to the **Dashboard** to find your **API Token**.
3.  **Plan:** The free tier allows 2,500 monthly lookups (Snapshot API).
4.  **Configuration:**
    *   The app is pre-configured to use the `fast` mode and `in` (India) region for maximum speed and accuracy on Indian plates.
    *   **Fallback:** If the API key is missing or the quota is exceeded, the app automatically switches to **client-side Tesseract.js** (slower but works without a key).

---

## 📖 Step-by-Step Usage Guide

### Phase 1: Setup
1.  **Sign In:** Logout/Login via Clerk. The `SUPER_ADMIN_EMAIL` automatically gets full access.
2.  **Create Branch:** Click the **Add Branch** button in the sidebar. This is required before adding staff or inventory.
3.  **Manage Roles:** Assign staff members to specific branches.

### Phase 2: Daily Operations
1.  **Scan Vehicle:** Open **Job Cards** -> **Scan Plate**. Point your camera at a number plate. The AI will detect it, confirm it (consensus), and redirect you.
2.  **Create Job Card:** Fill in service details. The app will pre-fill existing customer/vehicle data if known.
3.  **Inventory Management:** Add parts to the job card. Inventory levels will decrement automatically upon sale.
4.  **Billing:** Generate a professional PDF invoice with the click of a button.

### Phase 3: AI Analytics
1.  **Chat with MAC Assistant:** Use the **AI Assistant** tab to ask questions like:
    *   "How much revenue did Jangiganj branch make today?"
    *   "List all vehicles with service due next week."
    *   "Which inventory items are critically low?"

---

## 🔒 Security
*   **Next.js Proxy Architecture:** All middleware logic is handled at the network boundary.
*   **CSRF/Clickjacking Protection:** Secure headers (X-Frame-Options, CSP) are enabled via `next.config.ts`.
*   **RBAC:** Server Actions are protected by `requireRole` and `requireAuthenticatedUser` guards.

---

## 🛠️ Development Scripts
| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start development server |
| `pnpm build` | Production build (Next.js 16 Turbopack) |
| `pnpm db:seed` | Reset system roles and defaults |
| `pnpm db:studio` | Open GUI for database management |

---

*Made with ❤️ by Motor Auto Care Team*
