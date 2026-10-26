import { User, UserRole } from "@prisma/client";

export type UserDto = {
  id: string;
  role: UserRole;
  loginId: string;
  name: string;
  email: string | null;
  collegeId: string | null;
  mustChangePassword: boolean;
  supervisorId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserDto(user: User): UserDto {
  return {
    id: user.id, role: user.role, loginId: user.loginId, name: user.name,
    email: user.email, collegeId: user.collegeId, mustChangePassword: user.mustChangePassword,
    supervisorId: user.supervisorId, createdAt: user.createdAt, updatedAt: user.updatedAt,
  };
}
