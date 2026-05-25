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
- Run `env-manager up` after changing env schema/values that should be saved.
- Generate the shared env module directly with `env-manager ts packages/shared/src/env.ts --force`.
- Package scripts intentionally pass `--env-file=../../.env --env-file=../../.env.local` where needed so generated env validation sees the right values.
- Keep env names concise for this repo, e.g. `UI_URL`, `SERVER_URL`, `UI_PORT`, `PORT`, `SMOKE`, `SKIP_SERVER`.

# Local Dev Hosts

- UI: agent-manager.localhost -> 6050

# Frontend

- Tailwind CSS v4 is wired through `@tailwindcss/vite`.
- Skeleton v4 is installed with `@skeletonlabs/skeleton` and `@skeletonlabs/skeleton-svelte`.
- Global styles are imported from `apps/ui/src/routes/layout.css`.
- The active Skeleton theme is the local generated theme at `apps/ui/src/routes/theme.css`, applied via `data-theme="theme"` in `apps/ui/src/app.html`.
- `@skeletonlabs/skeleton-svelte` is excluded from Vite dependency optimization because its package imports internal `.svelte` files that esbuild cannot prebundle.
- `skipLibCheck` is enabled for the UI because Skeleton's published declarations currently create third-party declaration noise under `svelte-check`.

# Verification

- Standard checks: `bun run lint`, `bun run typecheck`, `bun run build`, `bun run test`.
- Browser smoke should hit `http://agent-manager.localhost` or `https://agent-manager.localhost` and verify same-origin `/api/*` requests.
- Electron smoke: `bun run smoke:electron`.
- If browser DevTools shows `agent-manager-api.localhost`, check stale tabs, DevTools overrides, preserved logs, or extensions. Current app code should only call relative `/api/*` paths.
