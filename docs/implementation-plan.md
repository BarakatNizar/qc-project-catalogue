# QC Implementation Plan

## 1. Implementation Objective

Implement Qalamoon Compass (QC) from the approved requirements and architecture as a production-structured modular monolith using:

- Next.js 16
- TypeScript
- PostgreSQL
- Prisma
- Zod
- Server Actions
- shadcn/ui
- daisyUI
- Zustand

The first implementation must deliver the complete core workflow:

```text
Admin/Supervisor provisioning
        ↓
Supervisor creates Student
        ↓
Student first login + password change
        ↓
Supervisor creates Project
        ↓
Student browses/searches/views Project
        ↓
Student requests AI Suggestions
        ↓
OpenRouter Main AI
        ↓
Fallback AI when configured/required
        ↓
Validated 3–4 new Suggestions
        ↓
Persist Response + Suggestions
        ↓
All Students can view Project Suggestions
        ↓
Supervisor can remove a Suggestion
```

---

# 2. Implementation Principles

- Implement from the requirements downward.
- Do not build speculative features.
- Keep domain modules independent.
- Keep the UI thin with business behavior in Services.
- Build testable infrastructure before connecting it to UI.
- Use mock AI providers for automated tests.
- Use the real OpenRouter integration only for explicit integration/smoke testing.
- Keep AI credentials in environment variables.
- Do not expose provider configuration through the Admin UI.

---

# 3. Phase 0 — Repository and Environment Audit

### Goals

Understand the existing repository before modifying it.

### Tasks

- Inspect existing `package.json`.
- Inspect current `src` structure.
- Inspect existing authentication implementation.
- Inspect existing `ServerUser` type.
- Inspect current Prisma setup.
- Inspect existing `errorParser`.
- Inspect existing `AuthorizationLayer`, if present.
- Inspect existing UI primitives.
- Inspect existing Server Action conventions.
- Inspect existing validation conventions.
- Inspect existing test setup.
- Inspect existing environment/configuration conventions.

### Deliverable

A short internal implementation inventory:

```text
Existing
Missing
Reusable
Needs modification
```

Do not rewrite existing infrastructure when a compatible implementation already exists.

---

# 4. Phase 1 — Foundation and Shared Infrastructure

## Goals

Establish the technical foundation required by all modules.

### Tasks

- Confirm Prisma/PostgreSQL connection.
- Establish UUID v4 generation.
- Establish environment validation.
- Establish application error handling.
- Establish authentication access helper.
- Establish `ServerUser`.
- Establish `AuthorizationLayer`.
- Establish shared validation structure.
- Establish standard Service result types where appropriate.
- Establish transaction helper/convention if needed.

### Deliverables

```text
/core/auth
/core/authorization
/core/errors

/shared/validation
/infrastructure/database
/infrastructure/config
```

### Verification

- TypeScript passes.
- Prisma connects.
- Server-side current-user resolution works.
- Authorization checks can be unit-tested.

---

# 5. Phase 2 — Database Schema

Implement the approved Prisma schema.

## Tables

```text
User
Project
ProjectFeature
ProjectTechnology
ProjectImage
AiServiceSettings
AiSuggestionResponse
AiSuggestion
```

## Enums

```text
UserRole
ProjectType
ProjectVisibility
ProjectFeatureScope
AiProvider
AiExecutionMode
```

## Required Relationships

```text
User.supervisorId → User.id
Project → ProjectFeature[]
Project → ProjectTechnology[]
Project → ProjectImage[]
Project → AiSuggestionResponse[]
Project → AiSuggestion[]
AiSuggestionResponse → User?
AiSuggestionResponse → AiSuggestion[]
AiSuggestion → User?
```

## Required deletion rules

```text
Supervisor User → Student.supervisorId = SET NULL

Student User → AI provenance = SET NULL

Project → all Project-specific dependent data = CASCADE

AiSuggestionResponse → AiSuggestion = CASCADE
```

### Migration verification

Verify:

- Foreign keys.
- Nullable fields.
- Unique constraints.
- Indexes.
- Cascade behavior.
- Set-null behavior.

---

# 6. Phase 3 — User Module

Implement:

```text
/modules/user
/actions/user
/shared/validation/user
```

## Functionality

### Admin

- Create Supervisor.
- Edit Supervisor.
- Delete Supervisor.
- View Supervisor list/details.

### Supervisor

- Create Student.
- View Student list/details.
- Delete Student.

### Student

- Update own profile.
- Change password.
- Complete first-login password change.

## Rules

- No public registration.
- Student login ID = College ID.
- Initial password = College ID.
- Initial password is hashed.
- `mustChangePassword = true`.
- College ID is unique.
- Student cannot edit College ID.

### Tests

- Account creation.
- Duplicate IDs.
- Initial password state.
- Password hashing.
- Password change.
- Role authorization.
- Supervisor deletion with Student association.
- Student deletion.

---

# 7. Phase 4 — Admin AI Service State

Implement:

```text
AiServiceSettings
```

and Admin controls:

```text
Enable AI
Disable AI
```

## Rules

When disabled:

- No new AI generation.
- Existing Projects remain accessible.
- Existing AI Suggestions remain accessible.

### Tests

- Admin can toggle.
- Supervisor cannot toggle.
- Student cannot toggle.
- AI generation is blocked when disabled.

---

# 8. Phase 5 — Project Module

Implement:

```text
/modules/project
/actions/project
/shared/validation/project
```

## Functionality

- Create Project.
- Read Project.
- Update Project.
- Hide Project.
- Show Project.
- Delete Project.
- Browse Projects.
- Search Projects.
- Manage Features.
- Manage Technologies.
- Manage Images.

## Project Template

Implement:

```text
Title
Summary
Description
Problem Statement
Proposed Solution
Objectives
Project Supervisor Name
Project Type
In-Scope Features
Out-of-Scope Features
Technologies
Images
Visibility
```

## Critical rule

Do not create:

```text
Project.supervisorId
```

The Project Supervisor is only:

```text
projectSupervisorName: string
```

## Tests

- Project creation.
- Validation.
- Edit.
- Hide/show.
- Delete cascade.
- Student visibility rules.
- Supervisor global project permissions.
- Project supervisor name independence from QC Supervisor users.
- Feature ordering.
- Technology uniqueness within Project.
- Image persistence.

---

# 9. Phase 6 — Project Search

Implement Student/Supervisor Project search.

Initial search capabilities:

```text
Text
Project Supervisor Name
```

Search must operate only on Projects visible to Students.

Supervisor management views can include hidden Projects.

### Tests

- Search by Supervisor name.
- Hidden projects excluded for Students.
- Hidden projects available to Supervisors.
- Empty results.
- Partial matches where supported.

---

# 10. Phase 7 — AI Provider Abstraction

Create:

```text
/modules/ai
/infrastructure/ai
```

## Domain contract

```ts
interface AiProvider {
  generateSuggestions(
    input: AiGenerationInput
  ): Promise<AiProviderResult>;
}
```

## Infrastructure implementations

```text
OpenRouterProvider
LocalProvider
```

The provider abstraction must not expose provider-specific behavior to the Project or User modules.

---

# 11. Phase 8 — OpenRouter Main Provider

Use OpenRouter's OpenAI-compatible API.

Current OpenRouter Free Models Router identifier:

```text
openrouter/free
```

OpenRouter documents `openrouter/free` as a router that selects among currently available free models and filters for request capabilities such as structured outputs. The current Free plan also has request-rate limits, so automated tests must not depend on live free-provider calls.

## Environment

The implementation reads server-side configuration:

```env
AI_MAIN_PROVIDER=OPENROUTER
AI_MAIN_BASE_URL=https://openrouter.ai/api/v1
AI_MAIN_API_KEY=...
AI_MAIN_MODEL=openrouter/free
```

Fallback variables:

```env
AI_FALLBACK_PROVIDER=...
AI_FALLBACK_BASE_URL=...
AI_FALLBACK_API_KEY=...
AI_FALLBACK_MODEL=...
```

Provider credentials are server-only.

## Request

Use the OpenAI-compatible chat completions interface:

```text
POST /api/v1/chat/completions
```

Use structured JSON output for the AI result.

Set provider routing so requests require providers that support the requested parameters.

The OpenRouter free router currently supports structured-output-capable routing, but provider capabilities can change, so the application still validates the returned data with Zod.

---

# 12. Phase 9 — AI Response Contract

The persisted logical AI output is:

```ts
const aiSuggestionResponseSchema = z.object({
  suggestions: z
    .array(
      z.object({
        content: z.string().min(1),
      })
    )
    .min(3)
    .max(4),
});
```

No additional suggestion fields are implemented.

The application stores:

```text
AiSuggestionResponse.responseContent
AiSuggestion.content
```

The individual Suggestions are normalized from the validated response.

---

# 13. Phase 10 — Fixed AI System Prompt

Create a fixed application prompt in the AI implementation/configuration layer.

The prompt must instruct the model to:

- Analyze the Project context.
- Respect current Project scope.
- Respect in-scope and out-of-scope features.
- Consider technologies.
- Consider existing Suggestions.
- Avoid duplicate suggestions.
- Produce 3–4 meaningful feature enhancements.
- Avoid trivial changes.
- Avoid unrealistic/huge changes.
- Return only the required structured response.

Do not create:

- Admin prompt editing.
- Supervisor prompt editing.
- Student prompt editing.
- Database system-prompt records.

---

# 14. Phase 11 — AI Context Builder

Build a structured `AiGenerationInput` from:

```text
Project
Project Features
Project Technologies
Project Supervisor Name
Existing AI Suggestions
```

The context must be generated server-side.

The Student sends only:

```text
projectId
```

The browser never constructs the AI context.

---

# 15. Phase 12 — AI Generation Service

Implement the full AI flow:

```text
Authenticate
→ Validate projectId
→ Authorize Student
→ Check AI enabled
→ Load visible Project
→ Load existing Suggestions
→ Build AI context
→ Call Main AI
→ Fallback on failure
→ Validate response
→ Remove duplicate suggestions
→ Persist response + new suggestions transactionally
→ Return existing + new Suggestions
```

---

# 16. Phase 13 — Duplicate Processing

The AI receives existing Suggestions as context.

The application also performs deterministic duplicate filtering before persistence.

Normalization:

```text
trim
lowercase
collapse whitespace
```

Exact normalized duplicates are not persisted.

Semantic novelty remains primarily an AI responsibility.

Do not introduce embeddings/vector search in the first implementation.

---

# 17. Phase 14 — AI Suggestion History

Implement:

```text
getProjectAiSuggestions
requestNewAiSuggestions
deleteAiSuggestion
```

Rules:

- All Students can view existing Suggestions for visible Projects.
- Suggestions are linked to the Project.
- Suggestions are linked to the AI Response.
- Suggestions retain triggering-user provenance.
- Removing a Suggestion permanently deletes it.
- Removed Suggestions are no longer used in future generation context.
- AI Responses remain unless separately removed as part of Project deletion.

---

# 18. Phase 15 — UI Implementation

Implement the page hierarchy from the approved UI design.

## Authentication

```text
/login
/change-password
/profile
```

## Admin

```text
/admin
/admin/supervisors
/admin/supervisors/[supervisorId]
/admin/ai
```

## Supervisor

```text
/supervisor
/supervisor/students
/supervisor/students/[studentId]
/supervisor/projects
/supervisor/projects/new
/supervisor/projects/[projectId]
/supervisor/projects/[projectId]/edit
```

## Student

```text
/projects
/projects/[projectId]
```

---

# 19. Phase 16 — Project UI

Implement:

- Project catalog.
- Search.
- Supervisor filter.
- Project Card.
- Project Details.
- Project creation form.
- Project edit form.
- Feature editor.
- Technology editor.
- Image manager.
- Hide/Show controls.
- Delete confirmation.

---

# 20. Phase 17 — AI UI

Implement inside Project Details:

```text
AI Suggestions
```

and:

```text
Suggest New Features
```

States:

```text
Idle
Generating
Success
Error
```

Success displays:

```text
Existing Suggestions
+
New Suggestions
```

Supervisor management adds:

```text
Remove Suggestion
```

---

# 21. Phase 18 — Authorization Testing

Create an authorization test matrix covering every protected operation.

Minimum tests:

```text
Admin:
    Supervisor CRUD
    AI toggle

Supervisor:
    Student CRUD
    Project CRUD
    Hide/Show
    Suggestion deletion

Student:
    Visible Project read
    Hidden Project denied
    Search
    AI generation

Unauthorized:
    Student → Project mutation denied
    Student → Suggestion deletion denied
    Student → AI toggle denied
    Supervisor → Supervisor CRUD denied
```

---

# 22. Phase 19 — Integration Testing

Test complete workflows.

## Workflow A

```text
Admin
→ Create Supervisor
→ Supervisor login
```

## Workflow B

```text
Supervisor
→ Create Student
→ Student login
→ Force password change
→ Update profile
```

## Workflow C

```text
Supervisor
→ Create Project
→ Add features
→ Add technologies
→ Add images
→ Publish
```

## Workflow D

```text
Student
→ Search Project
→ View Project
→ View Suggestions
```

## Workflow E

```text
Student
→ Request AI
→ Main AI
→ Validate
→ Persist
→ Display
```

## Workflow F

```text
Main AI fails
→ Fallback AI
→ Validate
→ Persist
```

## Workflow G

```text
Supervisor
→ Remove Suggestion
→ Student no longer sees it
→ Future AI request excludes it from context
```

---

# 23. Phase 20 — Security Verification

Verify:

- Server-side authorization.
- Password hashing.
- Initial-password enforcement.
- No client-side AI credentials.
- No client-side provider calls.
- No unauthorized Project access.
- No unauthorized mutation.
- Input validation.
- AI output validation.
- Safe error responses.
- Transactional persistence.

---

# 24. Phase 21 — Performance and Reliability

Verify:

- Project listing does not load image `BYTEA` payloads unnecessarily.
- Project image retrieval is separate from Project metadata when appropriate.
- AI generation does not block unrelated UI requests.
- AI failures are handled cleanly.
- Main/Fallback timeout behavior is bounded.
- Database transactions remain short.
- Search uses the defined indexes.

---

# 25. Phase 22 — Final Testing

Required checks:

```text
npm run lint
npm run typecheck
npm test
```

plus the project-specific Prisma commands:

```text
prisma validate
prisma generate
prisma migrate status
```

Run the exact scripts already defined in `package.json` when they differ.

---

# 26. Phase 23 — Documentation

Maintain:

```text
README.md
docs/
```

Documentation includes:

- Setup.
- Environment variables.
- Database setup.
- Admin provisioning.
- Development commands.
- AI provider setup.
- Architecture summary.
- Testing instructions.
- Deployment instructions.

---

# 27. Phase 24 — Production Readiness

Before final release:

- Run database migrations.
- Verify environment variables.
- Provision initial Admin.
- Verify AI service configuration.
- Verify Main/Fallback provider connectivity.
- Verify authentication.
- Verify role authorization.
- Verify Project visibility.
- Verify AI Suggestion persistence.
- Verify image persistence.
- Verify error handling.
- Verify backup/recovery procedure.

---

# 28. Implementation Order

The implementation order is fixed:

```text
01. Repository audit
        ↓
02. Foundation
        ↓
03. Database / Prisma
        ↓
04. User module
        ↓
05. Admin AI state
        ↓
06. Project module
        ↓
07. Project search
        ↓
08. AI provider abstraction
        ↓
09. OpenRouter provider
        ↓
10. AI response contract
        ↓
11. Fixed prompt
        ↓
12. AI context builder
        ↓
13. AI generation service
        ↓
14. AI Suggestion history
        ↓
15. Authentication UI
        ↓
16. Admin UI
        ↓
17. Supervisor UI
        ↓
18. Student Project UI
        ↓
19. AI UI
        ↓
20. Authorization tests
        ↓
21. Integration tests
        ↓
22. Security verification
        ↓
23. Final testing
        ↓
24. Documentation
        ↓
25. Production readiness
```

---

# 29. Definition of Done

QC implementation is complete when:

- All approved use cases are implemented.
- All authorization rules are enforced server-side.
- All database relationships match the ERD.
- All Project operations work.
- Student onboarding works.
- Project search works.
- AI generation works.
- Main/fallback behavior works.
- AI output is validated.
- AI Suggestions are persisted.
- Existing Suggestions are reused as generation context.
- Suggestions can be removed.
- Hidden Projects are inaccessible to Students.
- Project Supervisor names are independent of QC Supervisor accounts.
- OpenRouter credentials remain server-side.
- Automated tests pass.
- Type checking passes.
- Linting/formatting passes.
- Prisma validation/migrations pass.
- Documentation is complete.
