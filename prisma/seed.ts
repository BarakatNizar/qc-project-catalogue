import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const loginId = process.env.ADMIN_ID?.trim();
  const password = process.env.ADMIN_PASS;
  if (!databaseUrl || !loginId || !password) {
    throw new Error("DATABASE_URL, ADMIN_ID, and ADMIN_PASS are required. Configure them before provisioning the initial administrator.");
  }
  if (password.length < 12) throw new Error("ADMIN_PASS must contain at least 12 characters.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const existing = await prisma.user.findUnique({ where: { loginId } });
    if (existing) {
      if (existing.role !== "ADMIN") throw new Error("ADMIN_ID already belongs to a non-admin account. Choose a different ADMIN_ID.");
      console.log(`Administrator '${loginId}' already exists; credentials were not changed.`);
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.create({ data: { role: "ADMIN", loginId, name: process.env.ADMIN_NAME?.trim() || "QC Administrator", passwordHash, mustChangePassword: false } });
      console.log(`Created the initial administrator '${loginId}'. Store its credentials securely.`);
    }
    await prisma.aiServiceSettings.upsert({ where: { id: "global" }, update: {}, create: { id: "global", enabled: true } });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Admin provisioning failed.");
  process.exitCode = 1;
});
