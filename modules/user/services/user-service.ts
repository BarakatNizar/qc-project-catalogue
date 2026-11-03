import "server-only";
import { Prisma } from "@prisma/client";
import type { ServerUser } from "@/core/auth/session";
import { authorize } from "@/core/authorization/authorization-layer";
import { AppError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/core/auth/password";
import { 
  checkSupervisor_Create_Schema, 
  checkSupervisor_Update_Schema, 
  checkSupervisorPassword_Reset_Schema, 
  checkStudent_Create_Schema, 
  checkProfile_Update_Schema, 
  checkPassword_Change_Schema,
  checkStudentPassword_Reset_Schema,
  type CreateSupervisorPayload,
  type UpdateSupervisorPayload,
  type ResetSupervisorPasswordPayload,
  type CreateStudentPayload,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
  type ResetStudentPasswordPayload,
  checkUserId_Schema
} from "@/shared/validation/user";
import { userRepository } from "@/modules/user/repositories/user-repository";
import { toUserDto, UserDto } from "@/modules/user/mappers/user-mapper";
import { getPaginationMeta, PaginationMeta } from "@/shared/utils/pagincation-utils";

function mapKnownError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("CONFLICT");
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError("NOT_FOUND");
  throw error;
}
 
export const userService = {
  async listSupervisors(actor: ServerUser, page = 1, pageSize = 10):Promise<{data:UserDto[], pagination:PaginationMeta}> {
    authorize(actor, "SUPERVISOR_MANAGE");
    const { data, totalCount } = await userRepository.listByRole("SUPERVISOR", page, pageSize);
    return {
      data,
      pagination: getPaginationMeta(totalCount, page, pageSize),
    };
  },

  async listStudents(actor: ServerUser, page = 1, pageSize = 10):Promise<{data:UserDto[], pagination:PaginationMeta}> {
    authorize(actor, "STUDENT_MANAGE");
    const { data, totalCount } = await userRepository.listByRole("STUDENT", page, pageSize);
    return {
      data,
      pagination: getPaginationMeta(totalCount, page, pageSize),
    };
  },

  async searchSupervisors(actor: ServerUser, query: string, page = 1, pageSize = 10):Promise<{data:UserDto[], pagination:PaginationMeta}> {
    authorize(actor, "SUPERVISOR_MANAGE");
    if (!query || query.trim() === "") {
      return this.listSupervisors(actor, page, pageSize);
    }
    const { data, totalCount } = await userRepository.searchByRole("SUPERVISOR", query.trim(), page, pageSize);
    return {
      data,
      pagination: getPaginationMeta(totalCount, page, pageSize),
    };
  },

  async searchStudents(actor: ServerUser, query: string, page = 1, pageSize = 10):Promise<{data:UserDto[], pagination:PaginationMeta}> {
    authorize(actor, "STUDENT_MANAGE");
    if (!query || query.trim() === "") {
      return this.listStudents(actor, page, pageSize);
    }
    const { data, totalCount } = await userRepository.searchByRole("STUDENT", query.trim(), page, pageSize);
    return {
      data,
      pagination: getPaginationMeta(totalCount, page, pageSize),
    };
  },

  async getProfile(actor: ServerUser) {
    const user = await userRepository.findById(actor.id);
    if (!user) throw new AppError("UNAUTHENTICATED");
    return toUserDto(user);
  },

  async getCounts(actor: ServerUser) {
    if (actor.role !== "ADMIN" && actor.role !== "SUPERVISOR") throw new AppError("FORBIDDEN");
    return userRepository.getCounts();
  },

  async getSupervisor(actor: ServerUser, supervisorId: string) {
    authorize(actor, "SUPERVISOR_MANAGE");
    const validation = checkUserId_Schema(supervisorId);
    if(!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }
    const user = await userRepository.findById(supervisorId);
    if (!user || user.role !== "SUPERVISOR") throw new AppError("NOT_FOUND");
    return toUserDto(user);
  },

  async getStudent(actor: ServerUser, studentId: string) {
    authorize(actor, "STUDENT_MANAGE");
    const validation = checkUserId_Schema(studentId);
    if(!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }
    const user = await userRepository.findById(studentId);
    if (!user || user.role !== "STUDENT") throw new AppError("NOT_FOUND");
    return toUserDto(user);
  },

  // Supervisor Mutations
  async createSupervisor(actor: ServerUser, payload: CreateSupervisorPayload) {
    authorize(actor, "SUPERVISOR_MANAGE");
    const validation = checkSupervisor_Create_Schema(payload);
    if (!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }
    try {
      // console.log(payload)
      const created = await userRepository.create({ 
        role: "SUPERVISOR", 
        loginId: payload.loginId, 
        name: payload.name, 
        email: payload.email ? payload.email : undefined,
        passwordHash: await hashPassword(payload.password) 
      });
      return created;
    } catch (error) { 
      return mapKnownError(error); 
    }
  },

  async updateSupervisor(actor: ServerUser, payload: UpdateSupervisorPayload) {
    authorize(actor, "SUPERVISOR_MANAGE");
    const validation = checkSupervisor_Update_Schema(payload);
    if (!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }
    try { 
      return await userRepository.updateSupervisor(payload.supervisorId, { 
        name: payload.data.name, 
        email: payload.data.email 
      }); 
    } catch (error) { 
      return mapKnownError(error); 
    }
  },
  
  async resetSupervisorPassword(actor: ServerUser, payload: ResetSupervisorPasswordPayload) {
    authorize(actor, "RESET_SUPERVISOR_PASSWORD");
    const validation = checkSupervisorPassword_Reset_Schema(payload);
    if (!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }

    const passwordHash = await hashPassword(payload.data.password);
    try { 
      return await userRepository.resetSupervisorPassword(payload.supervisorId, { passwordHash }); 
    } catch (error) {
      return mapKnownError(error); 
    }
  },
  
  async deleteSupervisor(actor: ServerUser, supervisorId: string) {
    authorize(actor, "SUPERVISOR_MANAGE");
    const validation = checkUserId_Schema(supervisorId);
    if(!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }
    try { 
      return await userRepository.deleteSupervisor(supervisorId); 
    } catch (error) { 
      return mapKnownError(error); 
    }
  },

  // Student Mutations
  async createStudent(actor: ServerUser, payload: CreateStudentPayload) {
    authorize(actor, "STUDENT_MANAGE");
    const validation = checkStudent_Create_Schema(payload);
    if (!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }

    try {
      const passwordHash = await hashPassword(payload.collegeId);
      return await userRepository.create({
        role: "STUDENT", 
        loginId: payload.collegeId, 
        collegeId: payload.collegeId,
        name: payload.name, 
        email: payload.email, 
        passwordHash, 
        mustChangePassword: true, 
        supervisorId: actor.id,
      });
    } catch (error) { 
      return mapKnownError(error); 
    }
  },

  async resetStudentPassword(actor: ServerUser, payload: ResetStudentPasswordPayload) {
    authorize(actor, "RESET_STUDENT_PASSWORD");
    const validation = checkStudentPassword_Reset_Schema(payload);
    if (!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }

    const passwordHash = await hashPassword(payload.data.password);
    try { 
      return await userRepository.resetStudentPassword(payload.studentId, { passwordHash }); 
    } catch (error) {
      return mapKnownError(error); 
    }
  },

  async deleteStudent(actor: ServerUser, studentId: string) {
    authorize(actor, "STUDENT_MANAGE");
    try { 
      return await userRepository.deleteStudent(studentId); 
    } catch (error) { 
      return mapKnownError(error); 
    }
  },

  // User Mutations (General per user)
  async updateProfile(actor: ServerUser, payload: UpdateProfilePayload) {
    authorize(actor, "PROFILE_MANAGE");
    const validation = checkProfile_Update_Schema(payload);
    if (!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }

    try { 
      return await userRepository.updateProfile(actor.id, { name: payload.name, email: payload.email }); 
    } catch (error) { 
      return mapKnownError(error); 
    }
  },

  async changePassword(actor: ServerUser, payload: ChangePasswordPayload) {
    const validation = checkPassword_Change_Schema(payload);
    if (!validation.ok) {
      throw new AppError("VALIDATION", validation.reason);
    }

    const current = await userRepository.findById(actor.id);
    if (!current || !(await verifyPassword(payload.currentPassword, current.passwordHash))) {
      throw new AppError("VALIDATION", "The current password is incorrect.");
    }

    const updated = await userRepository.updatePassword(actor.id, await hashPassword(payload.newPassword));
    return toUserDto({ ...current, ...updated, passwordHash: current.passwordHash });
  },
};