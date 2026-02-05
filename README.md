# NexusPoint

Building modern Point of Sale (POS) systems shouldn't require weeks of configuration hell. NexusPoint is a high-performance, multi-tenant POS platform that eliminates the tedious setup work so you can focus on what matters: delivering a seamless commerce experience.

Designed for businesses that value both speed and reliability, NexusPoint provides a complete foundation for modern retail and restaurant applications. From single-location shops to global franchises, it scales with your ambitions while maintaining the best-in-class developer experience you deserve.

## What You Get

- **Performance by Default**: Bun runtime delivers exceptional speed across development and production. Experience lightning-fast checkout processes and inventory updates.
- **Type Safety Throughout**: TypeScript and tRPC create an unbreakable contract between frontend and backend. Catch errors at compile time, ensuring reliable transactions.
- **Modern React Stack**: React 19 with TanStack Router provides type-safe navigation and powerful data fetching patterns for real-time order management.
- **Edge-Native Deployment**: Cloudflare Workers ensure your POS runs close to your stores worldwide. Experience sub-100ms response times globally.
- **Database Ready**: Drizzle ORM with Neon PostgreSQL provides a complete data layer. Multi-tenant and multi-branch support included out of the box.
- **Developer Experience**: ESLint, Prettier, and VSCode configurations eliminate bikeshedding. Focus on business logic, not formatting.

## Perfect For

- **Retail & Restaurant Chains**: Multi-tenant architecture with robust multi-branch and inventory management.
- **SaaS POS Providers**: A solid foundation for building your own specialized commerce platform.
- **Global Franchises**: Edge deployment ensures consistent performance across all geographic locations.
- **Rapid Prototyping**: Skip configuration and start building specialized POS features immediately.
- **Omnichannel Commerce**: Unified order management across POS, web, and third-party delivery integrations.

---

This project was bootstrapped with [NexusPoint](https://github.com/kriasoft/react-starter-kit).
Be sure to join our [Discord channel](https://discord.gg/2nKEnKq) for assistance.

## Technology Stack

**Core Runtime & Platform**

- [Bun](https://bun.sh/) — Lightning-fast JavaScript runtime and package manager
- [Cloudflare Workers](https://workers.cloudflare.com/) — Edge computing platform

### Frontend & UI

- [React 19](https://react.dev/) — Latest React with concurrent features
- [TanStack Router](https://tanstack.com/router) — Type-safe routing with data loading
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful, accessible components
- [Jotai](https://jotai.org/) — Atomic state management
- [Astro](https://astro.build/) — Static site generator for marketing pages

### Backend & API

- [Hono](https://hono.dev/) — Ultra-fast web framework for the edge
- [tRPC](https://trpc.io/) — End-to-end type safety for APIs
- [Better Auth](https://www.better-auth.com/) — Modern authentication solution

### Database & ORM

- [Drizzle ORM](https://orm.drizzle.team/) — TypeScript ORM with excellent DX
- [Neon PostgreSQL](https://get.neon.com/HD157BR) — Serverless PostgreSQL (referral — supports the project)

### Development Tools

- [Vite](https://vitejs.dev/) — Next-generation frontend tooling
- [Vitest](https://vitest.dev/) — Blazing fast unit testing
- [TypeScript](https://www.typescriptlang.org/) — Static type checking
- [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) — Code quality and formatting

## Monorepo Architecture

This starter kit uses a thoughtfully organized monorepo structure that promotes code reuse and maintainability:

- [`apps/app/`](./apps/app) — React 19 application with TanStack Router, Jotai, and Tailwind CSS v4
- [`apps/web/`](./apps/web) — Astro marketing website for static site generation
- [`apps/api/`](./apps/api) — tRPC API server powered by Hono framework for Cloudflare Workers
- [`apps/email/`](./apps/email) — React Email templates for authentication and transactional emails
- [`packages/core/`](./packages/core) — Shared TypeScript types and utilities
- [`packages/ui/`](./packages/ui) — Shared UI components with shadcn/ui management utilities
- [`packages/ws-protocol/`](./packages/ws-protocol) — WebSocket protocol template with type-safe messaging
- [`db/`](./db) — Database schemas, migrations, and seed data
- [`docs/`](./docs) — VitePress documentation site
- [`infra/`](./infra) — Terraform infrastructure configurations for multi-environment deployment
- [`scripts/`](./scripts) — Build automation and development tools

**Why Monorepo?** This structure enables seamless code sharing between frontend and backend, ensures type consistency across your entire stack, and simplifies dependency management. When you update a type definition, both client and server stay in sync automatically.

**Deployment Flexibility:** Each app can be deployed independently to Cloudflare Workers for global edge computing, ensuring optimal performance worldwide.

## Prerequisites

- [Bun](https://bun.sh/) v1.3+ (replaces Node.js and npm)
- [VS Code](https://code.visualstudio.com/) with our [recommended extensions](.vscode/extensions.json)
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) browser extension (recommended)
- [Cloudflare account](https://dash.cloudflare.com/sign-up) for deployment

## Quick Start

### 1. Create Your Project

[Generate a new repository](https://github.com/kriasoft/react-starter-kit/generate) from this template, then clone it locally:

```bash
git clone https://github.com/your-username/your-project-name.git
cd your-project-name
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment

Update environment variables in [`.env`](./.env) and `.env.local` files as well as Wrangler configuration in [`wrangler.jsonc`](./apps/api/wrangler.jsonc).

### 4. Start Development

```bash
# Launch all apps in development mode (web, api, and app)
bun dev

# Or, start specific apps individually
bun --filter @repo/web dev  # Marketing site
bun --filter @repo/app dev  # Main application
bun --filter @repo/api dev  # API server
```

### 5. Initialize Database

Set up your database connection and schema:

```bash
# Apply migrations to database
bun --filter @repo/db migrate

# Quick development setup (pushes schema directly, skips migrations)
bun --filter @repo/db push

# Seed with sample data (optional)
bun --filter @repo/db seed

# Open database GUI for inspection
bun --filter @repo/db studio
```

**Note:** Ensure `DATABASE_URL` is configured in your `.env.local` file before running these commands.

Open <http://localhost:5173> to see your React app running. The marketing website runs on <http://localhost:4321>. The backend API will be available at the port shown by `wrangler dev` (typically 8787).

## Production Deployment

### 1. Environment Setup

Configure your production secrets in Cloudflare Workers:

```bash
# Required secrets
bun wrangler secret put BETTER_AUTH_SECRET

# OAuth providers (as needed)
bun wrangler secret put GOOGLE_CLIENT_ID
bun wrangler secret put GOOGLE_CLIENT_SECRET

# Email service
bun wrangler secret put RESEND_API_KEY

# AI features (optional)
bun wrangler secret put OPENAI_API_KEY
```

Note: run these commands from the target app directory or pass `--config apps/<app>/wrangler.jsonc`.

**Note:** The `RESEND_EMAIL_FROM` is configured in `wrangler.jsonc` as it's not sensitive.

### 2. Build and Deploy

```bash
# Build packages that require compilation (order matters!)
bun email:build    # Build email templates first
bun web:build      # Build marketing site
bun app:build      # Build main React app

# Deploy all applications
bun web:deploy     # Deploy marketing site
bun api:deploy     # Deploy API server
bun app:deploy     # Deploy main React app
```

Your application will be live on your Cloudflare Workers domain within seconds. The edge-first architecture ensures optimal performance regardless of user location.

## Backers 💰

<a href="https://reactstarter.com/b/1"><img src="https://reactstarter.com/b/1.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/2"><img src="https://reactstarter.com/b/2.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/3"><img src="https://reactstarter.com/b/3.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/4"><img src="https://reactstarter.com/b/4.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/5"><img src="https://reactstarter.com/b/5.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/6"><img src="https://reactstarter.com/b/6.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/7"><img src="https://reactstarter.com/b/7.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/b/8"><img src="https://reactstarter.com/b/8.png" height="60" /></a>

## Contributors 👨‍💻

<a href="https://reactstarter.com/c/1"><img src="https://reactstarter.com/c/1.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/2"><img src="https://reactstarter.com/c/2.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/3"><img src="https://reactstarter.com/c/3.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/4"><img src="https://reactstarter.com/c/4.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/5"><img src="https://reactstarter.com/c/5.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/6"><img src="https://reactstarter.com/c/6.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/7"><img src="https://reactstarter.com/c/7.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/8"><img src="https://reactstarter.com/c/8.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/9"><img src="https://reactstarter.com/c/9.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/10"><img src="https://reactstarter.com/c/10.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/11"><img src="https://reactstarter.com/c/11.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/12"><img src="https://reactstarter.com/c/12.png" height="60" /></a>&nbsp;&nbsp;<a href="https://reactstarter.com/c/13"><img src="https://reactstarter.com/c/13.png" height="60" /></a>

## Need Help?

[Ask GPT](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant) — AI assistant trained on this codebase. Try these questions:

- [How do I add a new tRPC endpoint?](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant?prompt=How%20do%20I%20add%20a%20new%20tRPC%20endpoint%3F)
- [Help me create a database table](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant?prompt=Help%20me%20create%20a%20database%20table)
- [How does authentication work?](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant?prompt=How%20does%20authentication%20work%3F)
- [Explain the project structure](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant?prompt=Explain%20the%20project%20structure)
- [How do I deploy to Cloudflare?](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant?prompt=How%20do%20I%20deploy%20to%20Cloudflare%3F)
- [Add a new page with routing](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant?prompt=Add%20a%20new%20page%20with%20routing)
- [How do I send emails?](https://chatgpt.com/g/g-69564f0a23088191846aa4072bd9397d-react-starter-kit-assistant?prompt=How%20do%20I%20send%20emails%3F)

## Contributing

We welcome contributions! Whether you're fixing bugs, improving docs, or proposing new features, check out our [Contributing Guide](.github/CONTRIBUTING.md) to get started.

- [Good first issues](https://github.com/kriasoft/react-starter-kit/issues?q=label:"good+first+issue") for beginners
- [Discord community](https://discord.gg/2nKEnKq) for help and discussions
- [Open issues](https://github.com/kriasoft/react-starter-kit/issues) needing attention

## License

Copyright © 2014-present Kriasoft. This source code is licensed under the MIT license found in the
[LICENSE](https://github.com/kriasoft/react-starter-kit/blob/main/LICENSE) file.

---

<sup>Made with ♥ by Konstantin Tarkus ([@koistya](https://twitter.com/koistya), [blog](https://medium.com/@koistya))
and [contributors](https://github.com/kriasoft/react-starter-kit/graphs/contributors).</sup>
