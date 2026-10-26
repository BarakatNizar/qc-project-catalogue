//shared/validation/user.ts
import { z } from "zod";

export type ValidationResult = { ok: true } | { ok: false; reason: string };

const userIdSchema= z.uuid("Invalid User Id");
export function checkUserId_Schema(id:string): ValidationResult {
  const parsed = userIdSchema.safeParse(id);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid User Id: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}

const optionalEmail = z
  .union([z.string().trim().email("Enter a valid email address."), z.literal("")])
  .optional()
  .transform((value) => value || undefined);

const loginIdSchema= z.string().trim().min(9).max(120);
const passwordSchema= z.string().min(9).max(256);
// ==========================================
// Login
// ==========================================
export const loginSchema = z.object({
  loginId: loginIdSchema,
  password:
  passwordSchema,
});
export type LoginPayload = z.infer<typeof loginSchema>;

export function checkLogin_Schema(payload: LoginPayload): ValidationResult {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid login payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}

// ==========================================
// Create Supervisor
// ==========================================
export const createSupervisorSchema = z.object({
  loginId: z.string().trim().min(9).max(80).regex(/^\d+$/, { message: 'Login ID must contain numbers only' }),
  name: z.string().trim().min(2).max(160),
  email: optionalEmail,
  password:
  passwordSchema,
});
export type CreateSupervisorPayload = z.infer<typeof createSupervisorSchema>;

export function checkSupervisor_Create_Schema(payload: CreateSupervisorPayload): ValidationResult {
  const parsed = createSupervisorSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid supervisor creation payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}

// ==========================================
// Update Supervisor
// ==========================================
export const updateSupervisorSchema = z.object({
  supervisorId: z.uuid("Invalid supervisor ID format"),
  data: z.object({
    name: z.string().trim().min(2).max(160),
    email: optionalEmail,
  }),
});
export type UpdateSupervisorPayload = z.infer<typeof updateSupervisorSchema>;
export type UpdateSupervisorData = UpdateSupervisorPayload["data"];

export function checkSupervisor_Update_Schema(payload: UpdateSupervisorPayload): ValidationResult {
  const parsed = updateSupervisorSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid supervisor update payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}

// ==========================================
// Reset Supervisor Password
// ==========================================
export const resetSupervisorPasswordSchema = z.object({
  supervisorId: z.uuid("Invalid supervisor ID format"),
  data: z.object({
    password: passwordSchema,
  }),
});
export type ResetSupervisorPasswordPayload = z.infer<typeof resetSupervisorPasswordSchema>;
export type ResetSupervisorPasswordData = ResetSupervisorPasswordPayload["data"];

export function checkSupervisorPassword_Reset_Schema(payload: ResetSupervisorPasswordPayload): ValidationResult {
  const parsed = resetSupervisorPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid supervisor password reset payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}

// ==========================================
// Create Student
// ==========================================
export const createStudentSchema = z.object({
  collegeId: z.string('College ID must contain numbers only and between 9-16 digits.').trim().min(9).max(16).regex(/^\d+$/ ),
  name: z.string("Student Name must be between 2-35 chars").trim().min(2).max(35),
  email: optionalEmail,
});
export type CreateStudentPayload = z.infer<typeof createStudentSchema>;

export function checkStudent_Create_Schema(payload: CreateStudentPayload): ValidationResult {
  const parsed = createStudentSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid student creation payload: ${parsed.error.issues[0].message}`,
    };
  }
  return { ok: true };
}


// ==========================================
// Reset Student Password
// ==========================================
export const resetStudentPasswordSchema = z.object({
  studentId: z.uuid("Invalid student ID format"),
  data: z.object({
    password: passwordSchema,
  }),
});
export type ResetStudentPasswordPayload = z.infer<typeof resetStudentPasswordSchema>;
export type ResetStudentPasswordData = ResetStudentPasswordPayload["data"];
export function checkStudentPassword_Reset_Schema(payload: ResetStudentPasswordPayload): ValidationResult {
  const parsed = resetStudentPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid student password reset payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}


// ==========================================
// Update Profile
// ==========================================
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  email: optionalEmail.nullable(),
});
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;

export function checkProfile_Update_Schema(payload: UpdateProfilePayload): ValidationResult {
  const parsed = updateProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid profile update payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}

// ==========================================
// Change Password
// ==========================================
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "The new passwords do not match.",
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "Choose a new password different from your current password.",
  });
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;
export function checkPassword_Change_Schema(payload: ChangePasswordPayload): ValidationResult {
  const parsed = changePasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid password change payload: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
    };
  }
  return { ok: true };
}