// // modules/translation/services/project-translation.service.ts
// import "server-only";

// import type { ProjectData } from "@/modules/project/types";

// import { translationService } from "./translation.service";
// import { TranslationField, TranslationInput, TranslationLanguage, TranslationResult } from "../types/translation.types";

// type ProjectTextField =
//   | "title"
//   | "summary"
//   | "description"
//   | "problemStatement"
//   | "proposedSolution"
//   | "objectives"
//   | "targetUsers"
//   | "availableResources"
//   | "constraints";

// const PROJECT_TEXT_FIELDS: Array<{
//   key: ProjectTextField;
//   translationField: TranslationField;
// }> = [
//   { key: "title", translationField: "project.title" },
//   { key: "summary", translationField: "project.summary" },
//   { key: "description", translationField: "project.description" },
//   { key: "problemStatement", translationField: "project.problemStatement" },
//   { key: "proposedSolution", translationField: "project.proposedSolution" },
//   { key: "objectives", translationField: "project.objectives" },
//   { key: "targetUsers", translationField: "project.targetUsers" },
//   { key: "availableResources", translationField: "project.availableResources" },
//   { key: "constraints", translationField: "project.constraints" },
// ];

// function inputId(projectIndex: number, field: string): string {
//   return `project:${projectIndex}:${field}`;
// }

// class ProjectTranslationService {
//   async translateProject( project: ProjectData, targetLanguage: TranslationLanguage ): Promise<TranslationResult<ProjectData>> {
    
//     const result = await this.translateProjects([project], targetLanguage);
//     if ("error" in result) return result;

//     const translatedProject = result.data[0];
//     if (!translatedProject) {
//       return { error: "Translation did not produce a project result." };
//     }

//     return { data: translatedProject };
//   }

//   async translateProjects( projects: ProjectData[], targetLanguage: TranslationLanguage, ): Promise<TranslationResult<ProjectData[]>> {
//     if (projects.length === 0) return { data: [] };

//     const inputs: TranslationInput[] = [];

//     projects.forEach((project, projectIndex) => {
//       for (const definition of PROJECT_TEXT_FIELDS) {
//         const value = project[definition.key];
//         if (typeof value !== "string" || value.trim().length === 0) continue;

//         inputs.push({
//           id: inputId(projectIndex, definition.key),
//           field: definition.translationField,
//           text: value,
//         });
//       }

//       project.features.forEach((feature, featureIndex) => {
//         if (feature.content.trim().length === 0) return;

//         inputs.push({
//           id: inputId(projectIndex, `feature:${featureIndex}`),
//           field: "projectFeature.content",
//           text: feature.content,
//         });
//       });
//     });

//     if (inputs.length === 0) {
//       return { data: projects.map((project) => ({ ...project })) };
//     }

//     const translationResult = await translationService.translateTexts( inputs, targetLanguage );

//     if ("error" in translationResult) return translationResult;

//     const translatedValues = new Map(
//       translationResult.data.map((result) => [result.id, result.translatedText]),
//     );

//     const translatedProjects = projects.map((project, projectIndex) => {
//       const updatedTextFields: Partial<ProjectData> = {};

//       for (const definition of PROJECT_TEXT_FIELDS) {
//         const originalValue = project[definition.key];
//         if (typeof originalValue !== "string") continue;

//         const translatedValue = translatedValues.get(
//           inputId(projectIndex, definition.key),
//         );

//         if (translatedValue !== undefined) {
//           (updatedTextFields as Record<string, unknown>)[definition.key] =
//             translatedValue;
//         }
//       }

//       const features = project.features.map((feature, featureIndex) => ({
//         ...feature,
//         content:
//           translatedValues.get(
//             inputId(projectIndex, `feature:${featureIndex}`),
//           ) ?? feature.content,
//       }));

//       return {
//         ...project,
//         ...updatedTextFields,
//         features,
//         // Technologies, supervisor name, date/year, enums, images and counts
//         // deliberately remain unchanged.
//       };
//     });

//     return { data: translatedProjects };
//   }
// }

// export const projectTranslationService = new ProjectTranslationService();

// modules/translation/services/project-translation.service.ts
import "server-only";

import type {
  ProjectListItem,
  ProjectRestDetails,
  ProjectSuggestions,
} from "@/modules/project/types";
import type {
  TranslationField,
  TranslationInput,
  TranslationLanguage,
  TranslationProviderName,
  TranslationResult,
} from "../types/translation.types";
import { translationService } from "./translation.service";
import { parseTranslationError } from "../utils/translation-error-parser";
import type { ServerUser } from "@/core/auth";

interface TranslationMapResult {
  values: Map<string, string>;
  provider?: TranslationProviderName;
}

function isSameLanguage(
  sourceLanguage: unknown,
  targetLanguage: TranslationLanguage,
): boolean {
  return sourceLanguage === targetLanguage;
}

function addInput(
  inputs: TranslationInput[],
  id: string,
  field: TranslationField,
  text: string | null | undefined,
): void {
  if (typeof text !== "string" || text.trim().length === 0) return;

  inputs.push({ id, field, text });
}

async function translateInputs(
  inputs: TranslationInput[],
  targetLanguage: TranslationLanguage,
): Promise<TranslationResult<TranslationMapResult>> {
  if (inputs.length === 0) {
    return { data: { values: new Map() } };
  }

  const result = await translationService.translateTexts(inputs, targetLanguage);
  if ("error" in result) return result;

  if (result.data.length !== inputs.length) {
    return { error: "Translation returned an incomplete result." };
  }

  const values = new Map<string, string>();
  for (const output of result.data) {
    if (
      !output ||
      typeof output.id !== "string" ||
      typeof output.translatedText !== "string" ||
      values.has(output.id)
    ) {
      return { error: "Translation returned an invalid or duplicate result." };
    }

    values.set(output.id, output.translatedText);
  }

  for (const input of inputs) {
    if (!values.has(input.id)) {
      return { error: "Translation did not return every requested field." };
    }
  }

  return {
    data: {
      values,
      ...(result.provider ? { provider: result.provider } : {}),
    },
    ...(result.provider ? { provider: result.provider } : {}),
  };
}

function withProvider<T>(
  data: T,
  provider?: TranslationProviderName,
): TranslationResult<T> {
  return {
    data,
    ...(provider ? { provider } : {}),
  };
}

class ProjectTranslationService {
  async translateProjectListItem(
    list: ProjectListItem,
    toLanguage: TranslationLanguage,
  ): Promise<TranslationResult<ProjectListItem>> {
    try {
      if (isSameLanguage(list.language, toLanguage)) {
        return { data: list };
      }

      const inputs: TranslationInput[] = [];
      addInput(inputs, "title", "project.title", list.title);
      addInput(inputs, "summary", "project.summary", list.summary);

      const result = await translateInputs(inputs, toLanguage);
      if ("error" in result) return result;

      return withProvider(
        {
          ...list,
          title: result.data.values.get("title") ?? list.title,
          summary: result.data.values.get("summary") ?? list.summary,
          language: toLanguage,
        },
        result.provider,
      );
    } catch (error) {
      return { error: parseTranslationError(error, "TRANSLATE") };
    }
  }

  async translateProjectDetails(
    details: ProjectRestDetails,
    toLanguage: TranslationLanguage,
  ): Promise<TranslationResult<ProjectRestDetails>> {
    try {
      if (isSameLanguage(details.language, toLanguage)) {
        return { data: details };
      }

      const inputs: TranslationInput[] = [];
      const fields: Array<{
        key:
          | "description"
          | "targetUsers"
          | "availableResources"
          | "constraints"
          | "problemStatement"
          | "proposedSolution"
          | "objectives";
        field: TranslationField;
      }> = [
        { key: "description", field: "project.description" },
        { key: "targetUsers", field: "project.targetUsers" },
        { key: "availableResources", field: "project.availableResources" },
        { key: "constraints", field: "project.constraints" },
        { key: "problemStatement", field: "project.problemStatement" },
        { key: "proposedSolution", field: "project.proposedSolution" },
        { key: "objectives", field: "project.objectives" },
      ];

      for (const definition of fields) {
        addInput(
          inputs,
          definition.key,
          definition.field,
          details[definition.key],
        );
      }

      details.features.forEach((feature, index) => {
        addInput(
          inputs,
          `feature:${index}`,
          "projectFeature.content",
          feature.content,
        );
      });

      const result = await translateInputs(inputs, toLanguage);
      if ("error" in result) return result;

      const translatedDetails: ProjectRestDetails = {
        ...details,
        description: result.data.values.get("description") ?? details.description,
        targetUsers: result.data.values.get("targetUsers") ?? details.targetUsers,
        availableResources:
          result.data.values.get("availableResources") ?? details.availableResources,
        constraints: result.data.values.get("constraints") ?? details.constraints,
        problemStatement:
          result.data.values.get("problemStatement") ?? details.problemStatement,
        proposedSolution:
          result.data.values.get("proposedSolution") ?? details.proposedSolution,
        objectives: result.data.values.get("objectives") ?? details.objectives,
        features: details.features.map((feature, index) => ({
          ...feature,
          content:
            result.data.values.get(`feature:${index}`) ?? feature.content,
        })),
        language: toLanguage,
      };

      return withProvider(translatedDetails, result.provider);
    } catch (error) {
      return { error: parseTranslationError(error, "TRANSLATE") };
    }
  }

  async translateProjectSuggestions(
    suggestions: ProjectSuggestions,
    toLanguage: TranslationLanguage,
  ): Promise<TranslationResult<ProjectSuggestions>> {
    try {
      if (isSameLanguage(suggestions.language, toLanguage)) {
        return { data: suggestions };
      }

      const inputs: TranslationInput[] = [];
      suggestions.suggestions.forEach((suggestion, index) => {
        addInput(
          inputs,
          `suggestion:${index}:title`,
          "projectSuggestion.title",
          suggestion.title,
        );
        addInput(
          inputs,
          `suggestion:${index}:content`,
          "projectSuggestion.content",
          suggestion.content,
        );
      });

      const result = await translateInputs(inputs, toLanguage);
      if ("error" in result) return result;

      return withProvider(
        {
          ...suggestions,
          language: toLanguage,
          suggestions: suggestions.suggestions.map((suggestion, index) => ({
            ...suggestion,
            title:
              result.data.values.get(`suggestion:${index}:title`) ??
              suggestion.title,
            content:
              result.data.values.get(`suggestion:${index}:content`) ??
              suggestion.content,
          })),
        },
        result.provider,
      );
    } catch (error) {
      return { error: parseTranslationError(error, "TRANSLATE") };
    }
  }

  async translateProjectListItems(
    lists: ProjectListItem[],
    toLanguage: TranslationLanguage,
  ): Promise<TranslationResult<ProjectListItem[]>> {
    try {
      if (lists.length === 0) return { data: lists };

      const inputs: TranslationInput[] = [];
      lists.forEach((list, index) => {
        if (isSameLanguage(list.language, toLanguage)) return;

        addInput(inputs, `project:${index}:title`, "project.title", list.title);
        addInput(inputs, `project:${index}:summary`, "project.summary", list.summary);
      });

      if (inputs.length === 0) return { data: lists };

      const result = await translateInputs(inputs, toLanguage);
      if ("error" in result) return result;

      const translatedLists = lists.map((list, index) => {
        if (isSameLanguage(list.language, toLanguage)) return list;

        return {
          ...list,
          title:
            result.data.values.get(`project:${index}:title`) ?? list.title,
          summary:
            result.data.values.get(`project:${index}:summary`) ?? list.summary,
          language: toLanguage,
        };
      });

      return withProvider(translatedLists, result.provider);
    } catch (error) {
      return { error: parseTranslationError(error, "TRANSLATE") };
    }
  }

  getServiceSettings() {
    return translationService.getServiceSettings();
  }

  setServiceEnabled(actor: ServerUser, enabled: boolean) {
    return translationService.setServiceEnabled(actor, enabled);
  }
}

export const projectTranslationService = new ProjectTranslationService();
