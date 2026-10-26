import "server-only";

import { Prisma, type AiProvider } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

const PROVIDER_SELECT = {
  id: true,
  name: true,
  provider: true,
  baseUrl: true,
  encryptedApiKey: true,
  model: true,
  timeoutMs: true,
  enabled: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AiProviderConfigSelect;

export type AiProviderConfigRow = Prisma.AiProviderConfigGetPayload<{
  select: typeof PROVIDER_SELECT;
}>;

export class AiProviderConfigLimitError extends Error {
  constructor() {
    super("A maximum of four AI providers can be configured.");
    this.name = "AiProviderConfigLimitError";
  }
}

export class AiProviderConfigNotFoundError extends Error {
  constructor() {
    super("The AI provider configuration was not found.");
    this.name = "AiProviderConfigNotFoundError";
  }
}

function ordered<T extends { sortOrder: number; createdAt: Date; id: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
}

async function normalizeOrder(
  tx: Prisma.TransactionClient,
  rows: AiProviderConfigRow[],
): Promise<void> {
  await Promise.all(
    rows.map((row, sortOrder) =>
      tx.aiProviderConfig.update({ where: { id: row.id }, data: { sortOrder } }),
    ),
  );
}

export const aiProviderConfigRepository = {
  async listForAdmin() {
    const rows = await prisma.aiProviderConfig.findMany({ select: PROVIDER_SELECT });
    return ordered(rows).map(({ encryptedApiKey, ...row }) => ({
      ...row,
      hasApiKey: Boolean(encryptedApiKey),
    }));
  },

  async listEnabledForExecution(): Promise<AiProviderConfigRow[]> {
    const rows = await prisma.aiProviderConfig.findMany({
      where: { enabled: true },
      select: PROVIDER_SELECT,
    });
    return ordered(rows);
  },

  findByIdWithSecret(id: string): Promise<AiProviderConfigRow | null> {
    return prisma.aiProviderConfig.findUnique({ where: { id }, select: PROVIDER_SELECT });
  },

  async save(input: {
    id?: string;
    name: string;
    provider: AiProvider;
    baseUrl: string;
    encryptedApiKey: string | null;
    model: string;
    timeoutMs: number;
    enabled: boolean;
    sortOrder: number;
  }) {
    return prisma.$transaction(
      async (tx) => {
        const rows = ordered(
          await tx.aiProviderConfig.findMany({ select: PROVIDER_SELECT }),
        );
        let saved: AiProviderConfigRow;
        let next: AiProviderConfigRow[];

        if (input.id) {
          const existing = rows.find((row) => row.id === input.id);
          if (!existing) throw new AiProviderConfigNotFoundError();

          saved = await tx.aiProviderConfig.update({
            where: { id: input.id },
            data: {
              name: input.name,
              provider: input.provider,
              baseUrl: input.baseUrl,
              encryptedApiKey: input.encryptedApiKey,
              model: input.model,
              timeoutMs: input.timeoutMs,
              enabled: input.enabled,
            },
            select: PROVIDER_SELECT,
          });

          next = rows.filter((row) => row.id !== input.id);
        } else {
          if (rows.length >= 4) throw new AiProviderConfigLimitError();

          saved = await tx.aiProviderConfig.create({
            data: {
              name: input.name,
              provider: input.provider,
              baseUrl: input.baseUrl,
              encryptedApiKey: input.encryptedApiKey,
              model: input.model,
              timeoutMs: input.timeoutMs,
              enabled: input.enabled,
              sortOrder: rows.length,
            },
            select: PROVIDER_SELECT,
          });
          next = rows;
        }

        const targetPosition = Math.max(0, Math.min(input.sortOrder, next.length));
        next.splice(targetPosition, 0, saved);
        await normalizeOrder(tx, next);

        const updated = await tx.aiProviderConfig.findMany({ select: PROVIDER_SELECT });
        return ordered(updated).map(({ encryptedApiKey, ...row }) => ({
          ...row,
          hasApiKey: Boolean(encryptedApiKey),
        }));
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async setEnabled(id: string, enabled: boolean) {
    return prisma.aiProviderConfig.update({
      where: { id },
      data: { enabled },
      select: { id: true, enabled: true },
    });
  },

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      const row = await tx.aiProviderConfig.findUnique({ where: { id }, select: { id: true } });
      if (!row) throw new AiProviderConfigNotFoundError();

      await tx.aiProviderConfig.delete({ where: { id } });
      const remaining = ordered(await tx.aiProviderConfig.findMany({ select: PROVIDER_SELECT }));
      await normalizeOrder(tx, remaining);
      return remaining.length;
    });
  },
};
