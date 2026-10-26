CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'STUDENT');
CREATE TYPE "ProjectType" AS ENUM ('GRADUATION', 'PRE_GRADUATION');
CREATE TYPE "ProjectVisibility" AS ENUM ('VISIBLE', 'HIDDEN');
CREATE TYPE "ProjectFeatureScope" AS ENUM ('IN_SCOPE', 'OUT_OF_SCOPE');
CREATE TYPE "AiProvider" AS ENUM ('OPENROUTER', 'LOCAL');
CREATE TYPE "AiExecutionMode" AS ENUM ('MAIN', 'FALLBACK');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "role" "UserRole" NOT NULL,
  "loginId" VARCHAR(120) NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "email" VARCHAR(254),
  "collegeId" VARCHAR(80),
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "supervisorId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_loginId_key" ON "users"("loginId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_collegeId_key" ON "users"("collegeId");
CREATE INDEX "users_role_name_idx" ON "users"("role", "name");
CREATE INDEX "users_supervisorId_idx" ON "users"("supervisorId");

CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "summary" VARCHAR(500) NOT NULL,
  "description" TEXT NOT NULL,
  "problemStatement" TEXT,
  "proposedSolution" TEXT,
  "objectives" TEXT,
  "projectSupervisorName" VARCHAR(160) NOT NULL,
  "projectType" "ProjectType" NOT NULL,
  "visibility" "ProjectVisibility" NOT NULL DEFAULT 'VISIBLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "projects_visibility_projectType_createdAt_idx" ON "projects"("visibility", "projectType", "createdAt");
CREATE INDEX "projects_title_idx" ON "projects"("title");
CREATE INDEX "projects_projectSupervisorName_idx" ON "projects"("projectSupervisorName");

CREATE TABLE "project_features" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "content" VARCHAR(500) NOT NULL,
  "scope" "ProjectFeatureScope" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_features_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_features_projectId_scope_sortOrder_idx" ON "project_features"("projectId", "scope", "sortOrder");

CREATE TABLE "project_technologies" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_technologies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_technologies_projectId_name_key" ON "project_technologies"("projectId", "name");
CREATE INDEX "project_technologies_projectId_sortOrder_idx" ON "project_technologies"("projectId", "sortOrder");

CREATE TABLE "project_images" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "data" BYTEA NOT NULL,
  "mimeType" VARCHAR(80) NOT NULL,
  "fileName" VARCHAR(255),
  "fileSizeBytes" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_images_projectId_sortOrder_idx" ON "project_images"("projectId", "sortOrder");

CREATE TABLE "ai_service_settings" (
  "id" VARCHAR(40) NOT NULL DEFAULT 'global',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_service_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_suggestion_responses" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "triggeredByUserId" UUID,
  "provider" "AiProvider" NOT NULL,
  "executionMode" "AiExecutionMode" NOT NULL,
  "model" VARCHAR(180) NOT NULL,
  "responseContent" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_suggestion_responses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_suggestion_responses_projectId_createdAt_idx" ON "ai_suggestion_responses"("projectId", "createdAt");
CREATE INDEX "ai_suggestion_responses_triggeredByUserId_idx" ON "ai_suggestion_responses"("triggeredByUserId");

CREATE TABLE "ai_suggestions" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "responseId" UUID NOT NULL,
  "triggeredByUserId" UUID,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_suggestions_projectId_createdAt_idx" ON "ai_suggestions"("projectId", "createdAt");
CREATE INDEX "ai_suggestions_responseId_idx" ON "ai_suggestions"("responseId");
CREATE INDEX "ai_suggestions_triggeredByUserId_idx" ON "ai_suggestions"("triggeredByUserId");

ALTER TABLE "users" ADD CONSTRAINT "users_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_features" ADD CONSTRAINT "project_features_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_suggestion_responses" ADD CONSTRAINT "ai_suggestion_responses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_suggestion_responses" ADD CONSTRAINT "ai_suggestion_responses_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "ai_suggestion_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
