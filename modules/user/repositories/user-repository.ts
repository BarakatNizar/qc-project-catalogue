import "server-only";
import { prisma } from "@/infrastructure/database/prisma";
import { Prisma, UserRole } from "@prisma/client";

const publicSelect = {
  id: true, role: true, loginId: true, name: true, email: true, collegeId: true,
  mustChangePassword: true, supervisorId: true, createdAt: true, updatedAt: true,
} as const;

export const userRepository = {
  findByLoginId(loginId: string) {
    return prisma.user.findUnique({ where: { loginId } });
  },
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  async listByRole(role: UserRole, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [data, totalCount] = await Promise.all([
      prisma.user.findMany({ 
        where: { role }, 
        select: publicSelect, 
        orderBy: [{ name: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where: { role } })
    ]);
    return { data, totalCount };
  },
  async searchByRole(role: UserRole, searchTerm: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const whereClause: Prisma.UserWhereInput = {
      role,
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { loginId: { contains: searchTerm, mode: "insensitive" } },
        { collegeId: { contains: searchTerm, mode: "insensitive" } },
      ],
    };
    const [data, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: publicSelect,
        orderBy: [{ name: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where: whereClause })
    ]);
    return { data, totalCount };
  },
  create(data: {
    role: UserRole; loginId: string; passwordHash: string; name: string; email?: string;
    collegeId?: string; mustChangePassword?: boolean; supervisorId?: string;
  }) {
    return prisma.user.create({ data, select: publicSelect });
  },
  updateSupervisor(id: string, data: { name: string; email?: string }) {
    return prisma.user.update({ where: { id, role: "SUPERVISOR" }, data, select: publicSelect });
  },
  resetSupervisorPassword(id: string, data: { passwordHash: string }) {
    return prisma.user.update({ where: { id, role: "SUPERVISOR" }, data: { passwordHash: data.passwordHash, mustChangePassword: true }, select: publicSelect });
  },
  resetStudentPassword(id: string, data: { passwordHash: string }) {
    return prisma.user.update({ where: { id, role: "STUDENT" }, data: { passwordHash: data.passwordHash, mustChangePassword: true }, select: publicSelect });
  },
  updateProfile(id: string, data: { email: string | null | undefined; name?: string | undefined; }) {
    return prisma.user.update({ where: { id }, data, select: publicSelect });
  },
  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash, mustChangePassword: false }, select: publicSelect });
  },
  deleteSupervisor(id: string) {
    return prisma.user.delete({ where: { id, role: "SUPERVISOR" }, select: publicSelect });
  },
  deleteStudent(id: string) {
    return prisma.user.delete({ where: { id, role: "STUDENT" }, select: publicSelect });
  },
  async getCounts() {
    const [supervisors, students, projects] = await Promise.all([
      prisma.user.count({ where: { role: "SUPERVISOR" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.project.count(),
    ]);
    return { supervisors, students, projects };
  },
};