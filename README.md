# Health Hub Pro Web Client

The frontend is a responsive TanStack Start application for patients, doctors, and administrators. It consumes the NestJS API and provides the booking, scheduling, health-record, billing, review, and settings workflows.

## Stack

- React 19 and TypeScript
- TanStack Start, Router, and Query
- Vite and Nitro
- Tailwind CSS, Radix UI, and Lucide React
- Zustand for client state
- Vitest and Testing Library

## Local development

Requirements: Node.js 20+ and npm 10+.

```bash
npm ci
copy .env.example .env       # Windows PowerShell
# cp .env.example .env       # macOS/Linux
npm run dev
```

Set `VITE_API_URL` to the backend API, normally `http://localhost:5000/api/v1`. The development server URL is printed by Vite.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the project with Prettier |

## Project organization

```text
src/
├── routes/           # File-based TanStack routes and authenticated views
├── components/       # Shared UI and domain components
├── hooks/api/        # React Query hooks for API data
├── services/         # Domain-specific HTTP clients
├── stores/           # Zustand state, including authentication
├── lib/              # Shared utilities, API helpers, and error handling
├── types/            # Frontend API and domain types
└── styles.css        # Global styles and design tokens
```

When adding a feature, keep route composition in `routes/`, reusable visual primitives in `components/ui/`, domain UI in the relevant component folder, and server-state logic in `hooks/api/` or `services/`. Keep API types aligned with the backend DTOs.

## Environment

See [.env.example](.env.example). Vite exposes only variables prefixed with `VITE_` to browser code. Never put private API keys, database credentials, or server-side secrets in this file.

## Testing and production builds

Before opening a pull request, run:

```bash
npm run lint
npm run test
npm run build
```

The application is built for static delivery through the configured Nitro/Cloudflare output. See [../DEPLOYMENT.md](../DEPLOYMENT.md) for the hosted and Docker deployment options.
