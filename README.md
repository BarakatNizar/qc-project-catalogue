# Qalamoon Compass (QC)

Qalamoon Compass is a university project-knowledge system. Supervisors maintain structured graduation and pre-graduation project briefs; students search visible briefs and request AI-generated feature ideas; Administrators manage Supervisor accounts and control AI availability.

QC does **not** assign or reserve projects, approve students' final proposals, track project choices, store project source code, or use a QC Supervisor account as a project's academic supervisor identity.

## Implemented capabilities

- Three server-enforced roles: Admin, Supervisor, Student; no public registration.
- Admin provisioning outside the UI, Supervisor account management, and AI enable/disable.
- Student provisioning from college ID, hashed initial password, forced first-login password change, and editable profile without changing college ID.
- Project brief create/edit, structured in/out-of-scope features, project-specific technologies, PostgreSQL-backed images, search, visibility, and permanent cascading deletion.
- Project supervisor name as ordinary project metadata; there is no `Project.supervisorId`.
- Student catalogue/detail pages and shared project-level AI suggestions.
- Main/fallback OpenAI-compatible AI provider flow, `openrouter/free` as the configured OpenRouter model identifier, Zod output validation, exact normalized duplicate filtering, and atomic persistence of the execution record and suggestions.
- Role checks in services as well as protected routes; passwords hashed with bcrypt; signed, HttpOnly session cookies.
- English/LTR and Arabic/RTL document direction preference; light/dark QC theme preference.

## Requirements

- Node.js 20.9+ (Node.js 22 LTS recommended)
- PostgreSQL 15+ (any currently supported compatible PostgreSQL version is suitable)
- npm

The Prisma schema uses the Prisma 7 `prisma-client` generator with the PostgreSQL driver adapter.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a development database and database role in PostgreSQL. Do not run development migrations against production.

3. Copy `.env.example` to `.env` and configure `DATABASE_URL` and `SESSION_SECRET`. Replace every example credential before use. Generate a session secret with:

   ```bash
   openssl rand -base64 48
   ```

4. Generate the Prisma client and apply migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Set `ADMIN_ID`, `ADMIN_PASS`, and optionally `ADMIN_NAME`, then provision the initial Admin outside the application UI:

   ```bash
   npm run admin:provision
   ```

   The script does not overwrite an existing Admin's password. It also ensures the singleton AI service setting exists. Keep the provisioning environment restricted because `ADMIN_PASS` is a secret.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Visit `http://localhost:3000` and sign in at `/login`.

## AI provider setup

The main provider is configured only through environment variables. Default OpenRouter configuration:

```env
AI_MAIN_PROVIDER=OPENROUTER
AI_MAIN_BASE_URL=https://openrouter.ai/api/v1
AI_MAIN_API_KEY=your-server-side-key
AI_MAIN_MODEL=openrouter/free
```

An optional OpenAI-compatible fallback can be configured, for example a local `llama-server` endpoint:

```env
AI_FALLBACK_PROVIDER=LOCAL
AI_FALLBACK_BASE_URL=http://127.0.0.1:9090/v1
AI_FALLBACK_API_KEY=not-needed-for-local-server
AI_FALLBACK_MODEL=your-local-model-id
```

Only fully configured providers are used. If the main provider fails, times out, or returns malformed/invalid structured output, QC tries the configured fallback. Provider credentials are never sent to the browser. AI tests should mock providers; live calls are an explicit smoke test, not part of `npm test`.

Administrators can toggle AI generation at `/admin/ai`; existing suggestions remain available when generation is disabled.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start local Next.js development server |
| `npm run build` | Generate Prisma client and build production app |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run unit tests without live AI or database calls |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations in deployment environments |
| `npm run db:status` | Check migration status |
| `npm run admin:provision` | Create the first Admin if it does not exist |

## Architecture

```text
App Router pages/components
        ↓
Server Actions / server-rendered entry points
        ↓
Authentication + Zod validation
        ↓
Module Services (authorization/business rules)
        ↓
Repositories
        ↓
Prisma 7 + PostgreSQL
```

AI uses a separate provider boundary:

```text
AiService → AiProvider contract → OpenAI-compatible infrastructure provider
```

Main source directories:

- `app/` — pages, layouts, and image delivery route
- `actions/` — thin Server Actions
- `modules/user/` — account services, repository, and mapper
- `modules/project/` — project services, repository, and mapper
- `modules/ai/` — generation orchestration and suggestion persistence
- `core/` — session authentication, authorization, and safe application errors
- `infrastructure/` — Prisma connection, environment configuration, and AI provider implementation
- `shared/validation/` — Zod schemas
- `prisma/` — PostgreSQL schema and migration
- `tests/` — deterministic unit tests

## Security and domain rules

- Use only development databases with `db:migrate` or `db:push`.
- `SESSION_SECRET` must be random and at least 32 characters.
- Do not commit `.env`, provider keys, or real account passwords.
- Student `collegeId` is both the login ID and initial password, but only a bcrypt hash is persisted. Students must change the initial password and cannot edit their college ID.
- A Supervisor's deletion leaves Projects and Students; the Student's administrative `supervisorId` becomes null.
- Project deletion cascades to features, technologies, images, AI execution records, and suggestions.
- Student deletion clears AI trigger-user references while keeping shared AI history intact.
- Suggestions are shared among all students who can view the project. Deleting an individual suggestion is permanent and excludes it from subsequent AI context; its parent response remains.
- Project `projectSupervisorName` is plain text, not a foreign key.
- Provider URL, key, model, and fixed system prompt are not editable from QC Admin UI.

## Verification status

The source archive includes the committed initial PostgreSQL migration and the approved source-of-truth and implementation-plan documents. In the packaging environment, 73 TypeScript/TSX files passed syntax transpilation and 184 internal/relative imports were checked with no unresolved project-local imports. Dependency installation timed out, so a dependency-backed TypeScript check, ESLint run, test run, and Next.js build were **not** completed here. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, and the checks above in your environment. A live PostgreSQL service is needed for the database workflows; configured AI endpoints are needed for a live AI smoke test. Automated tests must not make live AI calls.
