# Stack

- Runtime: Bun API/SSE server
- Language: TypeScript, Svelte
- UI: SvelteKit SPA
- Desktop: Electron sidecar wrapper
- Linting: Oxlint + oxfmt
- Git Hooks: Lefthook

# Architecture

- The browser and Electron share the same SvelteKit UI code.
- Browser dev runs through localias at `agent-manager.localhost`, with Vite proxying same-origin `/api/*` requests to the Bun server on loopback.
- Electron is only a sidecar wrapper. It may use loopback URLs internally to avoid localias TLS issues, but browser-facing UI config should stay on the localias domain.
- The Bun server owns local filesystem/process access and exposes simple HTTP endpoints plus SSE for streaming agent events.

# Environment

- Environment files are managed by `env-manager`.
- Keep `.env` tracked with harmless/default values and `.env.local` ignored for local values.

# Local Dev Hosts

- UI: agent-manager.localhost -> 6050

# Frontend

- Tailwind CSS v4 is wired through `@tailwindcss/vite`.
- Skeleton v4 is installed with `@skeletonlabs/skeleton` and `@skeletonlabs/skeleton-svelte`.
- Global styles are imported from `apps/ui/src/routes/layout.css`.
- The active Skeleton theme is the local generated theme at `apps/ui/src/routes/theme.css`, applied via `data-theme="theme"` in `apps/ui/src/app.html`.
- `@skeletonlabs/skeleton-svelte` is excluded from Vite dependency optimization because its package imports internal `.svelte` files that esbuild cannot prebundle.
- `skipLibCheck` is enabled for the UI because Skeleton's published declarations currently create third-party declaration noise under `svelte-check`.
