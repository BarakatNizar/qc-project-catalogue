# Qalamoon Compass — Agent Instructions

## Authoritative project context

Read these files before making architecture or domain decisions:

1. `docs/qc-source-of-truth.md` — approved product and domain rules.
2. `docs/implementation-plan.md` — implementation phases and verification expectations.
3. `docs/architecture.md` — implemented module boundaries and local project map.

If a generated implementation detail conflicts with `docs/qc-source-of-truth.md`, the source-of-truth document wins.

## Non-negotiable rules

- Exactly three user roles: `ADMIN`, `SUPERVISOR`, and `STUDENT`. Do not add self-registration.
- Authorization must be enforced on the server in module services; hiding a UI control is not authorization.
- Admin can manage Supervisor accounts and toggle AI generation only. Admin cannot manage Students/Projects or edit AI provider settings/system prompt.
- Every Supervisor can manage every Student and every Project. Do not introduce owner restrictions.
- `Project.projectSupervisorName` is plain text; never add `Project.supervisorId`.
- Student login ID and initial password are both the College ID; persist only a secure password hash and force password change at first login. Students cannot change their College ID.
- Supervisor deletion must preserve Students and Projects; student supervisor references become null. Student deletion must preserve shared AI records while clearing user provenance. Project deletion cascades project-owned records.
- AI provider URL, API key, model and fixed system prompt are deployment configuration, not Admin-editable settings. Never expose credentials to client code.
- AI generation client input is only a project ID. Load trusted context on the server, validate the output with Zod, discard exact normalized duplicates, and persist the response plus suggestions transactionally.
- Suggestions are shared project knowledge. Removing a suggestion permanently deletes that suggestion, but does not delete its parent response.
- Use mocked providers for automated tests; never run live AI calls as part of tests.
- Avoid unrelated refactors, speculative features, or unneeded dependencies. Do not use destructive database commands or production database URLs.

## Architecture and coding

- Keep Server Actions thin: authenticate, validate, call a service, and return/redirect safely.
- Put business rules and authorization in services; put Prisma persistence in repositories; use mappers at persistence boundaries.
- Keep provider-specific code in `infrastructure/ai`, behind the AI provider interface.
- Use the existing Zod validation schemas and explicit safe error messages.
- Use `npm run typecheck`, `npm run lint`, and `npm test` when dependencies are installed. Validate Prisma and migrations using the package scripts in a development environment.
- Do not mark work verified when a required command has not actually passed. Clearly report environmental blockers.
