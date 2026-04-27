# CLAUDE.md — Provider UI

This file gives Claude Code context for working in this directory.

## What this app is

A portal for fresh food and vegetable **providers** (farmers, local suppliers) to interact with the store. Target users are non-technical people (farmers, local vendors), so the UI must be:
- Simple and easy to navigate
- All text and labels in **Vietnamese**
- Large, readable text
- Spacing and sizing in `em` / `%` (not `px`) for screen adaptability

## Tech stack

| Tool | Version | Purpose |
|------|---------|---------|
| React + Vite | 19 / 8 | Framework + build |
| TypeScript | 6 | Type safety |
| Ant Design | 5 | UI components (locale: `vi_VN`) |
| React Router | v6 | Client-side routing |
| TanStack Query | v5 | Server state / data fetching |
| Axios | latest | HTTP client |
| Zustand | latest | Client state (auth) |
| Recharts | latest | Charts on dashboard |

Dev server runs on **port 5273** (`vite.config.ts`).

## Folder structure

```
src/
├── config/
│   └── services.ts       # ← Single source of truth for all backend ports/URLs
├── layout/
│   ├── AuthLayout.tsx    # Centered card shell — used by /login, /register
│   └── AppLayout.tsx     # Sidebar + header shell — used by all app pages
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── TransactionPage.tsx
│   ├── DemandPage.tsx
│   └── ProfilePage.tsx
├── routes/
│   └── index.tsx         # All routes, wires pages to layouts
├── services/
│   ├── api.ts            # Axios factory — exports identityApi, backOfficeApi, etc.
│   └── auth.service.ts   # loginRequest()
├── store/
│   └── authStore.ts      # Zustand — user, token, login(), logout()
└── theme/
    └── index.ts          # Ant Design theme tokens (green palette)
```

## Backend services

All URLs are configured in `src/config/services.ts`. **To change a port, edit that file only.**

| Service | Default URL | Axios client |
|---------|------------|-------------|
| identity-service | `http://localhost:9000` | `identityApi` |
| back-office-service | `http://localhost:9100` | `backOfficeApi` |
| product-storage-service | `http://localhost:9200` | `productStorageApi` |
| ecommerce-service | `http://localhost:9300` | `ecommerceApi` |

Ports can also be overridden via `.env` (`VITE_IDENTITY_URL`, etc.). See `.env.example`.

## How to make API calls

Always import the correct client from `@/services/api`. The JWT token is attached automatically.

```ts
import { identityApi } from '@/services/api'

const res = await identityApi.get('/api/user/profile')
```

For each new feature, create a typed service file in `src/services/`:

```ts
// src/services/product.service.ts
import { backOfficeApi } from './api'

export async function getProducts() {
  const res = await backOfficeApi.get('/api/products')
  return res.data
}
```

## Auth flow

- JWT stored in `localStorage` under key `token`
- Zustand `useAuthStore` holds `{ user, token, login(), logout() }`
- Axios interceptor auto-attaches `Authorization: Bearer <token>` on every request
- On 401 response → clears token + redirects to `/login`
- Login response shape: `{ type, code, message, detail: { accessToken, user, roles, permissions } }`

## API response envelope

The identity service (and likely others) wraps all responses in:

```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "...",
  "detail": { ... },
  "timestamp": "..."
}
```

Check `type === "GOOD"` for success when the HTTP status alone is not enough.

## Routing

| Path | Layout | Page |
|------|--------|------|
| `/login` | AuthLayout | LoginPage |
| `/register` | AuthLayout | RegisterPage |
| `/dashboard` | AppLayout | DashboardPage |
| `/giao-dich` | AppLayout | TransactionPage |
| `/nhu-cau` | AppLayout | DemandPage |
| `/profile` | AppLayout | ProfilePage |
| `*` | — | Redirects to `/dashboard` |

## Conventions

- **No `px`** for layout sizing — use `em` or `%`
- **No comments** unless the why is non-obvious
- All user-visible strings in **Vietnamese**
- Ant Design components preferred over custom HTML
- `useMutation` (TanStack Query) for write operations, `useQuery` for reads
- Service files live in `src/services/`, one file per backend domain
- Types shared across files go in `src/types/` (create when needed)

## Current progress

See `PLAN.md` for the full task list and completion status. As of the last session:
- Tasks 1, 2, and 4 are complete
- Task 3 (Register screen) is next
