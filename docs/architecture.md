# QC Architecture Notes

## Layer boundaries

- Pages render server-fetched DTOs and compose UI; they do not use Prisma directly.
- Server Actions obtain the current user, parse input, call a service, and revalidate or redirect.
- Services apply operation-level authorization and orchestrate domain workflows.
- Repositories contain Prisma queries and transaction boundaries, but no role decisions.
- Mappers produce presentation/application DTOs rather than exposing complete database models.
- AI providers are behind an `AiProvider` contract and live in `infrastructure/ai`.

## User authorization matrix

| Capability | Admin | Supervisor | Student |
|---|---:|---:|---:|
| Create/edit/delete Supervisor | Yes | No | No |
| Create/delete Student | No | Yes | No |
| Create/edit/hide/show/delete Project | No | Yes | No |
| View visible Project | No | Yes | Yes |
| View hidden Project | No | Yes | No |
| View Project AI Suggestions | No | Yes | Yes for visible projects |
| Generate AI Suggestions | No | No | Yes for visible projects when enabled |
| Permanently delete Suggestion | No | Yes | No |
| Enable/disable AI service | Yes | No | No |
| Edit own profile/change password | Yes | Yes | Yes |

All Supervisors have global Student and Project management permission; creation ownership is not used for authorization.

## Data deletion

- Supervisor account: associated students remain; `supervisorId` becomes null. Projects are unaffected.
- Student account: AI provenance foreign keys become null; project-level AI suggestions remain.
- Project: child features, technologies, images, AI responses, and suggestions cascade-delete.
- Suggestion: the suggestion row is permanently deleted, while the parent AI response remains.

## AI request contract

The browser submits only a project ID. The server loads the project brief, ordered features, technologies, and current non-deleted suggestions. The fixed prompt requests three or four distinct, reasonable feature improvements. Each provider response is parsed and validated by Zod. QC normalizes generated content by trimming, case-folding, and collapsing whitespace, filters exact duplicates against existing and same-response suggestions, then transactionally persists one response and three or four suggestion rows. If provider validation, duplicate processing, or persistence fails, no partial new suggestions are persisted.
