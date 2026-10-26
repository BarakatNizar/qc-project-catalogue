import "server-only";

import { Prisma, type AiProvider } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import type { AiSuggestionResponsePayload } from "@/shared/validation/ai";

export const aiRepository = {
  async getSettings() {
    const settings = await prisma.aiServiceSettings.findUnique({ where: { id: "global" } });
    return settings ?? { id: "global", enabled: true, updatedAt: new Date(0) };
  },

  setEnabled(enabled: boolean) {
    return prisma.aiServiceSettings.upsert({
      where: { id: "global" },
      update: { enabled },
      create: { id: "global", enabled },
    });
  },

  listSuggestions(projectId: string) {
    return prisma.aiSuggestion.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        projectId: true,
        responseId: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });
  },

  deleteSuggestion(suggestionId: string) {
    return prisma.aiSuggestion.delete({
      where: { id: suggestionId },
      select: { id: true, projectId: true },
    });
  },

  async persistGeneration(input: {
    aiLogId: string;
    providerConfigId: string;
    projectId: string;
    triggeredByUserId: string;
    provider: AiProvider;
    model: string;
    responseContent: AiSuggestionResponsePayload;
    suggestions: { content: string; title: string }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const response = await tx.aiSuggestionResponse.create({
        data: {
          aiLogId: input.aiLogId,
          providerConfigId: input.providerConfigId,
          projectId: input.projectId,
          triggeredByUserId: input.triggeredByUserId,
          provider: input.provider,
          model: input.model,
          responseContent: input.responseContent as Prisma.InputJsonValue,
        },
        select: { id: true },
      });

      const suggestions = await Promise.all(
        input.suggestions.map((suggestion) =>
          tx.aiSuggestion.create({
            data: {
              projectId: input.projectId,
              responseId: response.id,
              triggeredByUserId: input.triggeredByUserId,
              title: suggestion.title,
              content: suggestion.content,
            },
            select: {
              id: true,
              projectId: true,
              responseId: true,
              title: true,
              content: true,
              createdAt: true,
            },
          }),
        ),
      );

      return { responseId: response.id, suggestions };
    });
  },
};
