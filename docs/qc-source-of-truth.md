# Qalamoon Compass (QC) — Implementation Source of Truth

## 1. Product Goal

Qalamoon Compass (QC) is a university web system that helps college students get inspiration for graduation and pre-graduation project ideas.

QC stores structured project briefs maintained by QC Supervisors. Students can explore and search those projects and ask an AI service to suggest reasonable new features for an existing project.

QC is an inspiration and project-knowledge system.

QC does not:

- Assign projects.
- Reserve projects.
- Claim projects.
- Approve final student project proposals.
- Track which project a student eventually chooses.
- Track the student's eventual implementation.
- Store complete project reports as the primary Project representation.
- Store source code.

---

## 2. System Roles

Exactly three QC user roles exist:

```text
ADMIN
SUPERVISOR
STUDENT
```

### Admin

Admin can:

- Create Supervisor users.
- View Supervisor users.
- Edit Supervisor users.
- Delete Supervisor users.
- Enable/disable the QC AI service.

Admin cannot:

- Manage Students.
- Manage Projects.
- Delete AI Suggestions.
- Edit AI URL/API key/model.
- Edit the AI system prompt.

### Supervisor

Every Supervisor can manage every Student and every Project.

Supervisor can:

- Create Student.
- View Students.
- Delete Student.
- Create Project.
- View Project.
- Edit Project.
- Hide Project.
- Show Project.
- Delete Project.
- View AI Suggestions.
- Delete AI Suggestions.

There is no project or student ownership restriction between Supervisors.

### Student

Student can:

- Authenticate.
- Change initial password.
- Change password.
- Edit own profile.
- Browse visible Projects.
- Search visible Projects.
- View visible Project.
- View existing AI Suggestions.
- Request new AI Suggestions.

Student cannot mutate Projects or existing AI Suggestions.

---

## 3. Registration and Provisioning

There is no public registration.

Admin users are provisioned outside normal QC UI with environment configuration and a Prisma provisioning script:

```env
ADMIN_ID=...
ADMIN_PASS=...
```

The provisioning script creates the initial Admin account.

Supervisor accounts are created by Admin.

Student accounts are created by Supervisor.

---

## 4. Student Initial Credentials

When a Supervisor creates a Student:

```text
loginId = collegeId
initial password = collegeId
mustChangePassword = true
```

The initial password is hashed before persistence.

On first login the Student must change the password.

College ID is unique and cannot be changed by the Student.

---

## 5. User Model

One `User` entity represents Admin, Supervisor, and Student accounts.

Core data:

```text
id: UUID v4
role
loginId
passwordHash
name?
email?
collegeId?
mustChangePassword
supervisorId?
createdAt
updatedAt
```

`supervisorId` is a nullable self-reference used only as an administrative association between a Student and a QC Supervisor.

The relationship does not restrict authorization.

All Supervisors can manage all Students.

If a Supervisor is deleted:

```text
Student.supervisorId = null
```

Students remain.

---

## 6. Project Model

A Project is a structured brief.

Core data:

```text
id
title
summary
description
problemStatement?
proposedSolution?
objectives?
projectSupervisorName
projectType
visibility
createdAt
updatedAt
```

Project types:

```text
GRADUATION
PRE_GRADUATION
```

Project visibility:

```text
VISIBLE
HIDDEN
```

### Critical Project Supervisor Rule

`projectSupervisorName` is plain Project metadata.

It is NOT a foreign key to `User`.

There is no `Project.supervisorId`.

A Project Supervisor does not need a QC account.

Deleting a QC Supervisor does not modify `projectSupervisorName`.

---

## 7. Project Features

Each Project can have multiple features.

Every feature has:

```text
id
projectId
content
scope
sortOrder
createdAt
updatedAt
```

Scope:

```text
IN_SCOPE
OUT_OF_SCOPE
```

Deleting the Project cascades to its features.

---

## 8. Project Technologies

Each Project has Project-specific technologies.

Every technology record contains:

```text
id
projectId
name
sortOrder
createdAt
```

A technology name is unique within its Project.

There is no global Technology entity.

---

## 9. Project Images

Each Project can contain multiple images.

Each image contains:

```text
id
projectId
data: BYTEA
mimeType
fileName?
fileSizeBytes
sortOrder
createdAt
```

Images are stored directly in PostgreSQL.

Deleting a Project cascades to its images.

---

## 10. Project Operations

Supervisor operations:

```text
createProject
getProject
getProjects
searchProjects
updateProject
hideProject
showProject
deleteProject
```

All Supervisors can perform these operations on all Projects.

Students can only read visible Projects.

Hidden Projects remain available to Supervisors.

Project deletion is permanent and cascades to Project-specific records.

---

## 11. Project Search

Initial search/filter requirements:

- Text search.
- Project Supervisor name.

The Project Supervisor search uses:

```text
Project.projectSupervisorName
```

It does not search the QC Supervisor user table.

Students only receive visible Projects.

---

## 12. AI Service State

QC stores one system setting:

```text
AiServiceSettings
    enabled: boolean
```

The Admin can enable/disable AI generation from QC.

When disabled:

- New AI generation is blocked.
- Existing AI Responses remain.
- Existing AI Suggestions remain visible.

Provider URL/API key/model are not stored in this table.

---

## 13. AI Provider Configuration

AI provider configuration is environment/deployment configuration.

Main provider:

```env
AI_MAIN_PROVIDER=OPENROUTER
AI_MAIN_BASE_URL=https://openrouter.ai/api/v1
AI_MAIN_API_KEY=...
AI_MAIN_MODEL=openrouter/free
```

Fallback provider:

```env
AI_FALLBACK_PROVIDER=...
AI_FALLBACK_BASE_URL=...
AI_FALLBACK_API_KEY=...
AI_FALLBACK_MODEL=...
```

The API keys remain server-side.

The Admin UI does not edit provider configuration.

---

## 14. AI Provider Architecture

Domain module:

```text
/modules/ai
```

Provider implementations:

```text
/infrastructure/ai
```

Provider contract:

```ts
interface AiProvider {
  generateSuggestions(
    input: AiGenerationInput
  ): Promise<AiProviderResult>;
}
```

Provider-specific implementations:

```text
OpenRouterProvider
LocalProvider
```

The Project module does not depend on a provider-specific AI implementation.

---

## 15. AI Model

The current OpenRouter model configuration is:

```text
openrouter/free
```

This is OpenRouter's Free Models Router.

Do not use:

```text
openrouter:free
```

as the OpenRouter API model identifier.

The Free Models Router can select different free underlying models, so QC logic must depend on its required output contract rather than on a specific underlying model.

---

## 16. AI Suggestion Response

`AiSuggestionResponse` represents one AI execution.

Core fields:

```text
id
projectId
triggeredByUserId?
provider
executionMode
model
responseContent JSONB
createdAt
```

`triggeredByUserId` refers to the Student who started the AI execution.

The actual successful provider can be:

```text
provider = OPENROUTER | LOCAL
executionMode = MAIN | FALLBACK
```

---

## 17. AI Suggestion

`AiSuggestion` represents one generated feature.

Core fields:

```text
id
projectId
responseId
triggeredByUserId?
content
createdAt
```

Business content is only:

```text
content
```

There are no:

```text
priority
difficulty
score
approval
included
excluded
status
```

fields.

---

## 18. AI Suggestion Visibility

AI Suggestions are shared Project knowledge.

All Students who can view a Project can view its stored Suggestions.

A Suggestion is not private to the Student who triggered it.

---

## 19. AI Suggestion Deletion

Only a Supervisor can delete a Suggestion.

Deletion is permanent.

After deletion:

- The Student no longer sees the Suggestion.
- The Suggestion is not included in future existing-suggestion context.
- The parent AI Suggestion Response remains unless the Project itself is deleted.

---

## 20. AI Request Trigger

The Student opens a visible Project and selects:

```text
Suggest New Features
```

The browser sends only:

```text
projectId
```

The server prepares the complete AI context.

The browser never sends the Project Template as trusted AI context.

---

## 21. AI Context

The AI context contains the structured Project information and existing Suggestions.

It includes as applicable:

```text
Project title
Summary
Description
Problem statement
Proposed solution
Objectives
Project type
Project Supervisor name
In-scope features
Out-of-scope features
Technologies
Existing AI Suggestions
```

Images are not sent to the AI in the first implementation.

---

## 22. Fixed AI Prompt

The AI system prompt is application configuration.

It is not editable by:

- Admin.
- Supervisor.
- Student.

The prompt instructs the AI to:

- Understand the existing Project.
- Respect Project scope.
- Consider in-scope features.
- Consider out-of-scope features.
- Consider technologies.
- Consider existing Suggestions.
- Avoid duplicates.
- Generate 3–4 meaningful enhancements.
- Avoid trivial changes.
- Avoid extremely large/unrealistic changes.
- Return only the required structured output.

---

## 23. AI Response Contract

The required logical response is:

```ts
{
  suggestions: [
    { content: string },
    { content: string },
    { content: string }
  ]
}
```

with 3–4 items total.

Zod validation:

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

The actual implementation can construct the schema with the project's existing Zod conventions.

AI output must be validated before persistence.

---

## 24. AI Execution

Complete flow:

```text
Student
  ↓
requestNewAiSuggestionsAction
  ↓
Authenticate
  ↓
Validate projectId
  ↓
AiService authorization
  ↓
Check Project exists
  ↓
Check Project is visible
  ↓
Check AI service is enabled
  ↓
Load Project
  ↓
Load existing Suggestions
  ↓
Build AiGenerationInput
  ↓
Call Main Provider
  ↓
Fallback on provider failure
  ↓
Validate response
  ↓
Remove exact normalized duplicates
  ↓
Validate final result
  ↓
Transaction:
  create AiSuggestionResponse
  create AiSuggestion × 3–4
  ↓
Return existing + new Suggestions
  ↓
Student sees result
```

---

## 25. AI Failure

Main provider failure includes:

- Timeout.
- Network failure.
- HTTP/provider error.
- Invalid response.
- Invalid structured output.

On Main failure:

```text
Main
  ↓ failure
Fallback
```

If both fail:

- No successful Suggestions are persisted.
- Existing Suggestions remain available.
- A safe AI error is returned.

---

## 26. AI Duplicate Processing

Existing Suggestions are supplied to the AI to discourage duplicate generation.

The application additionally performs deterministic exact duplicate filtering.

Normalization:

```text
trim
lowercase
collapse repeated whitespace
```

Exact normalized duplicates are not persisted.

Semantic similarity is not implemented in the first version.

---

## 27. AI Transaction

A successful AI generation persists:

```text
1 AiSuggestionResponse
3–4 AiSuggestion records
```

inside one database transaction.

The operation either succeeds as one logical unit or rolls back.

---

## 28. User Deletion Rules

### Supervisor deletion

```text
DELETE User
↓
Student.supervisorId → null
```

Projects remain unchanged.

### Student deletion

The Student account is permanently deleted.

Shared Project AI knowledge is preserved.

If historical AI records retain triggering-user references, those references become:

```text
null
```

### Project deletion

Delete:

```text
Project
ProjectFeature
ProjectTechnology
ProjectImage
AiSuggestionResponse
AiSuggestion
```

through cascading relationships.

---

## 29. Authorization

Authorization is role-based and server-side.

### Admin

```text
create/edit/delete Supervisor
enable/disable AI
```

### Supervisor

```text
create/view/delete Students
create/view/edit/hide/show/delete Projects
view/delete AI Suggestions
```

### Student

```text
view visible Projects
search visible Projects
view Suggestions
request AI generation
edit own profile
change password
```

Every Supervisor can manage every Project and Student.

---

## 30. Application Layers

```text
/app
/actions
/modules
/core
/shared
/infrastructure
```

Dependency direction:

```text
UI
 ↓
Server Actions
 ↓
Services
 ↓
Repositories
 ↓
Prisma/PostgreSQL
```

Cross-cutting:

```text
Services → Core
Services → Shared
```

AI:

```text
AiService
 ↓
AiProvider interface
 ↓
Infrastructure provider
```

---

## 31. Server Action Rules

Server Actions:

- Authenticate.
- Validate input.
- Call Services.
- Return result.

Server Actions do not:

- Query Prisma directly.
- Call AI providers directly.
- Contain business workflows.
- Implement resource authorization independently from the AuthorizationLayer.

---

## 32. Service Rules

Services:

- Receive validated application data.
- Receive `ServerUser`.
- Perform authorization.
- Execute business rules.
- Call repositories.
- Map results.
- Return explicit result unions.

---

## 33. Repository Rules

Repositories:

- Use Prisma.
- Perform persistence.
- Load required relations.
- Execute transactions where required.

Repositories do not decide user authorization.

---

## 34. Mapper Rules

Mappers convert persistence data to application/domain output types.

UI code does not use raw Prisma models as its main application contract.

---

## 35. Core Layer

```text
/core
├── auth
├── authorization
└── errors
```

### Auth

Provides:

```ts
getServerUserFromAccess()
```

### Authorization

Provides operation-level permission checks.

### Errors

Normalizes internal errors into safe application errors.

---

## 36. Validation

```text
/shared/validation
├── id
├── user
├── project
└── ai
```

Zod schemas define validation and inferred payload types.

---

## 37. UI Routes

```text
/login
/change-password
/profile

/admin
/admin/supervisors
/admin/supervisors/[supervisorId]
/admin/ai

/supervisor
/supervisor/students
/supervisor/students/[studentId]
/supervisor/projects
/supervisor/projects/new
/supervisor/projects/[projectId]
/supervisor/projects/[projectId]/edit

/projects
/projects/[projectId]
```

---

## 38. UI Responsibilities

Project Catalog:

- Search.
- Project Supervisor filter.
- Project Cards.
- Visible Projects only.

Project Details:

- Full Project brief.
- Features.
- Technologies.
- Images.
- Project Supervisor name.
- Existing AI Suggestions.
- `Suggest New Features`.

Supervisor Project Management:

- Edit.
- Hide/Show.
- Delete.
- AI Suggestion deletion.

Admin:

- Supervisor management.
- AI service enabled/disabled state.

---

## 39. UI Authorization

UI navigation/action visibility follows role permissions, but server authorization is authoritative.

Unauthorized direct Server Action calls are denied.

---

## 40. Database

PostgreSQL + Prisma.

Tables:

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

All primary keys are UUID v4.

---

## 41. Required Foreign Keys

```text
User.supervisorId → User.id
ProjectFeature.projectId → Project.id
ProjectTechnology.projectId → Project.id
ProjectImage.projectId → Project.id
AiSuggestionResponse.projectId → Project.id
AiSuggestionResponse.triggeredByUserId → User.id
AiSuggestion.projectId → Project.id
AiSuggestion.responseId → AiSuggestionResponse.id
AiSuggestion.triggeredByUserId → User.id
```

---

## 42. Required Delete Behaviors

```text
Supervisor → Student.supervisorId: SET NULL

Student → AiSuggestionResponse.triggeredByUserId: SET NULL

Student → AiSuggestion.triggeredByUserId: SET NULL

Project → Features: CASCADE
Project → Technologies: CASCADE
Project → Images: CASCADE
Project → AI Responses: CASCADE
Project → AI Suggestions: CASCADE

AiSuggestionResponse → AiSuggestion: CASCADE
```

---

## 43. Required Indexes

User:

```text
UNIQUE(loginId)
UNIQUE(collegeId)
INDEX(supervisorId)
INDEX(role)
```

Project:

```text
INDEX(visibility)
INDEX(projectType)
INDEX(projectSupervisorName)
INDEX(visibility, projectSupervisorName)
```

ProjectFeature:

```text
INDEX(projectId)
INDEX(projectId, scope, sortOrder)
```

ProjectTechnology:

```text
INDEX(projectId)
INDEX(projectId, sortOrder)
UNIQUE(projectId, name)
```

ProjectImage:

```text
INDEX(projectId, sortOrder)
```

AiSuggestionResponse:

```text
INDEX(projectId, createdAt)
INDEX(triggeredByUserId, createdAt)
```

AiSuggestion:

```text
INDEX(projectId, createdAt)
INDEX(responseId)
INDEX(triggeredByUserId, createdAt)
UNIQUE(responseId, content)
```

---

## 44. Application Module Structure

```text
/modules
├── user
│   ├── user.service.ts
│   ├── user.repository.ts
│   ├── user.types.ts
│   └── user.mapper.ts
│
├── project
│   ├── project.service.ts
│   ├── project.repository.ts
│   ├── project.types.ts
│   └── project.mapper.ts
│
└── ai
    ├── ai.service.ts
    ├── ai.repository.ts
    ├── ai.types.ts
    └── ai.mapper.ts
```

---

## 45. Infrastructure Structure

```text
/infrastructure
├── database
│   └── prisma.ts
│
├── ai
│   ├── ai-provider.ts
│   ├── openrouter-provider.ts
│   └── local-provider.ts
│
└── config
```

---

## 46. Definition of Done

A QC feature is complete when:

- It matches the requirements.
- Input validation exists.
- Server authorization exists.
- Service business logic exists.
- Repository persistence exists when required.
- UI is connected.
- Errors are handled.
- Important tests exist.
- Type checking passes.
- Lint/format checks pass.
- Prisma validation/migration checks pass.
- No unrelated scope has been introduced.

