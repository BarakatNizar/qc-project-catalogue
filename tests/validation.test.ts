import { describe, expect, it } from "vitest";
import { loginSchema, changePasswordSchema, createStudentSchema } from "@/shared/validation/user";
import { projectUpsertSchema, projectSearchSchema } from "@/shared/validation/project";
import { aiSuggestionResponseSchema } from "@/shared/validation/ai";
import { normalizeSuggestion, removeExactDuplicates } from "@/shared/utils/normalize-suggestion";

describe("user validation", () => {
  it("trims login identifiers", () => {
    expect(loginSchema.parse({ loginId: "  student-01 ", password: "test-password" }).loginId).toBe("student-01");
  });
  it("requires a matching confirmation and a strong new password", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "old-password", newPassword: "short", confirmPassword: "short" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "old-password", newPassword: "new-password-123", confirmPassword: "different-password" }).success).toBe(false);
  });
  it("requires student college identity fields", () => {
    expect(createStudentSchema.safeParse({ collegeId: "A100", name: "Student Name", email: "" }).success).toBe(true);
    expect(createStudentSchema.safeParse({ collegeId: "", name: "Student Name" }).success).toBe(false);
  });
});

describe("project validation", () => {
  const brief = {
    title: "Campus project planner",
    summary: "A structured planner for students and campus supervisors.",
    description: "A web application that helps students browse campus projects and understand their scope.",
    projectSupervisorName: "Dr. Example",
    projectType: "GRADUATION",
    inScopeFeatures: ["Search projects"],
    outOfScopeFeatures: ["Native mobile app"],
    technologies: ["Next.js", "PostgreSQL"],
  };
  it("accepts a valid structured brief", () => expect(projectUpsertSchema.safeParse(brief).success).toBe(true));
  it("requires enough context for a project brief", () => expect(projectUpsertSchema.safeParse({ ...brief, summary: "Too short" }).success).toBe(false));
  it("defaults catalogue filters", () => expect(projectSearchSchema.parse({})).toEqual({ query: "", supervisorName: "", projectType: "ALL" }));
});

describe("AI response contract and duplicate filtering", () => {
  it("accepts three or four non-empty suggestions", () => {
    expect(aiSuggestionResponseSchema.safeParse({ suggestions: [{ content: "Improve project search filters" }, { content: "Add saved search alerts" }, { content: "Introduce usage analytics" }] }).success).toBe(true);
    expect(aiSuggestionResponseSchema.safeParse({ suggestions: [{ content: "One only" }] }).success).toBe(false);
  });
  it("normalizes exact duplicates by trim, lowercase, and whitespace collapse", () => {
    expect(normalizeSuggestion("  Add   a SEARCH page ")).toBe("add a search page");
    expect(removeExactDuplicates(["Add a search page"], [" add A SEARCH PAGE ", "Add export to CSV", "Add   export to CSV", "Show alerts"])).toEqual(["Add export to CSV", "Show alerts"]);
  });
});
