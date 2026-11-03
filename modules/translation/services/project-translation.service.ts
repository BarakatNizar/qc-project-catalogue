import "server-only";

import type { ProjectDto } from "@/modules/project/types";

import { translationService } from "./translation.service";
import { TranslationField, TranslationInput, TranslationLanguage, TranslationResult } from "../types/translation.types";

type ProjectTextField =
  | "title"
  | "summary"
  | "description"
  | "problemStatement"
  | "proposedSolution"
  | "objectives"
  | "targetUsers"
  | "availableResources"
  | "constraints";

const PROJECT_TEXT_FIELDS: Array<{
  key: ProjectTextField;
  translationField: TranslationField;
}> = [
  { key: "title", translationField: "project.title" },
  { key: "summary", translationField: "project.summary" },
  { key: "description", translationField: "project.description" },
  { key: "problemStatement", translationField: "project.problemStatement" },
  { key: "proposedSolution", translationField: "project.proposedSolution" },
  { key: "objectives", translationField: "project.objectives" },
  { key: "targetUsers", translationField: "project.targetUsers" },
  { key: "availableResources", translationField: "project.availableResources" },
  { key: "constraints", translationField: "project.constraints" },
];

function inputId(projectIndex: number, field: string): string {
  return `project:${projectIndex}:${field}`;
}

class ProjectTranslationService {
  async translateProject( project: ProjectDto, targetLanguage: TranslationLanguage ): Promise<TranslationResult<ProjectDto>> {
    
    const result = await this.translateProjects([project], targetLanguage);
    if ("error" in result) return result;

    const translatedProject = result.data[0];
    if (!translatedProject) {
      return { error: "Translation did not produce a project result." };
    }

    return { data: translatedProject };
  }

  async translateProjects( projects: ProjectDto[], targetLanguage: TranslationLanguage, ): Promise<TranslationResult<ProjectDto[]>> {
    if (projects.length === 0) return { data: [] };

    const inputs: TranslationInput[] = [];

    projects.forEach((project, projectIndex) => {
      for (const definition of PROJECT_TEXT_FIELDS) {
        const value = project[definition.key];
        if (typeof value !== "string" || value.trim().length === 0) continue;

        inputs.push({
          id: inputId(projectIndex, definition.key),
          field: definition.translationField,
          text: value,
        });
      }

      project.features.forEach((feature, featureIndex) => {
        if (feature.content.trim().length === 0) return;

        inputs.push({
          id: inputId(projectIndex, `feature:${featureIndex}`),
          field: "projectFeature.content",
          text: feature.content,
        });
      });
    });

    if (inputs.length === 0) {
      return { data: projects.map((project) => ({ ...project })) };
    }

    const translationResult = await translationService.translateTexts( inputs, targetLanguage );

    if ("error" in translationResult) return translationResult;

    const translatedValues = new Map(
      translationResult.data.map((result) => [result.id, result.translatedText]),
    );

    const translatedProjects = projects.map((project, projectIndex) => {
      const updatedTextFields: Partial<ProjectDto> = {};

      for (const definition of PROJECT_TEXT_FIELDS) {
        const originalValue = project[definition.key];
        if (typeof originalValue !== "string") continue;

        const translatedValue = translatedValues.get(
          inputId(projectIndex, definition.key),
        );

        if (translatedValue !== undefined) {
          (updatedTextFields as Record<string, unknown>)[definition.key] =
            translatedValue;
        }
      }

      const features = project.features.map((feature, featureIndex) => ({
        ...feature,
        content:
          translatedValues.get(
            inputId(projectIndex, `feature:${featureIndex}`),
          ) ?? feature.content,
      }));

      return {
        ...project,
        ...updatedTextFields,
        features,
        // Technologies, supervisor name, date/year, enums, images and counts
        // deliberately remain unchanged.
      };
    });

    return { data: translatedProjects };
  }
}

export const projectTranslationService = new ProjectTranslationService();
