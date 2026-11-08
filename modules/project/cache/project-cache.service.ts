// // modules/project/cache/project-cache.service.ts
// import "server-only";

// import {
//   redisDeleteMany,
//   redisGetManyJson,
//   redisSetManyJson,
// } from "@/infrastructure/redis/redis-operations";
// import { parseRedisError } from "@/infrastructure/redis/redis-error-parser";
// import type { RedisJsonEntry, RedisResult } from "@/infrastructure/redis/redis.types";
// import type {
//   ProjectListItem,
//   ProjectRestDetails,
//   ProjectSuggestions,
// } from "@/modules/project/types";

// import {
//   projectListItemSchema,
//   projectLocalizedFullCacheResultSchema,
//   projectLocalizedItemCacheResultSchema,
//   projectLocalizedListsCacheResultSchema,
//   projectLocalizedSuggestionsCacheResultSchema,
//   projectFullCacheResultSchema,
//   projectItemsCacheResultSchema,
//   projectListsCacheResultSchema,
//   projectRestDetailsSchema,
//   projectSuggestionsCacheResultSchema,
//   projectSuggestionsSchema,
//   projectLocalizedDetailsCacheResultSchema,
//   projectsCacheDetailsResultSchema,
// } from "./project-cache.schemas";
// import {
//   buildProjectCacheKey,
//   buildProjectCacheKeys,
//   getProjectCacheTtlSeconds,
//   hasProjectId,
//   withCacheLanguage,
// } from "./project-cache.helpers";
// import {
//   mapFullProjectCache,
//   mapProjectDetailsCache,
//   mapProjectItemsCache,
//   mapProjectListsCache,
//   mapProjectSuggestionsCache,
// } from "./project-cache.mapper";
// import type {
//   LocalizedProjectFullCacheWrite,
//   LocalizedProjectItemsCacheWrite,
//   LocalizedProjectListCacheWrite,
//   LocalizedProjectDetailsCacheWrite,
//   LocalizedProjectSuggestionsCacheWrite,
//   ProjectCacheLanguage,
//   ProjectCacheReadResult,
//   ProjectCacheResource,
//   ProjectCacheWriteResult,
//   ProjectDetailsCacheValue,
//   ProjectFullCacheValue,
//   ProjectListCacheValue,
//   ProjectSuggestionsCacheValue,
//   ProjectFullCacheResult,
// } from "./project-cache.types";

// const INVALID_CACHE_DATA_MESSAGE =
//   "Cached project data failed schema validation and was removed.";
// const INVALID_WRITE_DATA_MESSAGE =
//   "Project cache write data failed schema validation.";

// interface CacheSchema {
//   safeParse(value: unknown):
//     | { success: true; data: unknown }
//     | { success: false; error: unknown };
// }

// class ProjectCacheValidationError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = "ProjectCacheValidationError";
//   }
// }

// interface CacheReadEntry {
//   key: string;
//   schema: CacheSchema;
// }

// interface CacheWriteEntry {
//   key: string;
//   value: unknown;
//   schema: CacheSchema;
// }

// /**
//  * Project-scoped Redis cache for list items, localized details, and suggestions.
//  * All public operations return a result object and contain operational errors.
//  */
// export class ProjectCacheService {
//   private async readEntries(
//     entries: CacheReadEntry[],
//   ): Promise<RedisResult<unknown[]>> {
//     try {
//       if (entries.length === 0) return { data: [] };

//       const redisResult = await redisGetManyJson<unknown>(
//         entries.map((entry) => entry.key),
//       );

//       if ("error" in redisResult) return redisResult;

//       const validValues: unknown[] = [];
//       const invalidKeys: string[] = [];

//       for (let index = 0; index < entries.length; index += 1) {
//         const value = redisResult.data[index] ?? null;

//         if (value === null) {
//           validValues.push(null);
//           continue;
//         }

//         const parsed = entries[index].schema.safeParse(value);

//         if (!parsed.success) {
//           invalidKeys.push(entries[index].key);
//           validValues.push(null);
//           continue;
//         }

//         validValues.push(parsed.data);
//       }

//       if (invalidKeys.length > 0) {
//         const deleteResult = await redisDeleteMany(invalidKeys);
//         if ("error" in deleteResult) return deleteResult;
//         return { error: INVALID_CACHE_DATA_MESSAGE };
//       }

//       return { data: validValues };
//     } catch (error) {
//       return { error: parseRedisError(error, "MGET") };
//     }
//   }

//   private async runWrite(
//     buildEntries: () => CacheWriteEntry[],
//   ): Promise<ProjectCacheWriteResult> {
//     try {
//       const entries = buildEntries();
//       const validatedEntries: RedisJsonEntry<unknown>[] = [];

//       for (const entry of entries) {
//         const parsed = entry.schema.safeParse(entry.value);

//         if (!parsed.success) {
//           return { ok: false, error: INVALID_WRITE_DATA_MESSAGE };
//         }

//         validatedEntries.push({
//           key: entry.key,
//           value: parsed.data,
//         });
//       }

//       const redisResult = await redisSetManyJson(
//         validatedEntries,
//         getProjectCacheTtlSeconds(),
//       );

//       if ("error" in redisResult) {
//         return { ok: false, error: redisResult.error };
//       }

//       return { ok: true };
//     } catch (error) {
//       return {
//         ok: false,
//         error:
//           error instanceof ProjectCacheValidationError
//             ? error.message
//             : parseRedisError(error, "MSET"),
//       };
//     }
//   }

//   private validateGetterResult<T>(
//     schema: CacheSchema,
//     value: unknown,
//   ): ProjectCacheReadResult<T> {
//     try {
//       const parsed = schema.safeParse(value);
//       if (!parsed.success) {
//         return { error: "Project cache result failed schema validation." };
//       }
//       return { data: parsed.data as T };
//     } catch (error) {
//       return { error: parseRedisError(error, "DESERIALIZE") };
//     }
//   }

//   private invalidProjectIdResult(): { error: string } {
//     return { error: "A valid project ID is required." };
//   }

//   private invalidProjectIdWriteResult(): ProjectCacheWriteResult {
//     return { ok: false, error: "A valid project ID is required." };
//   }

//   private fullCacheEntries(
//     input: LocalizedProjectFullCacheWrite,
//   ): CacheWriteEntry[] {
//     const projectId = input.list.id;

//     if (
//       input.details.id !== projectId ||
//       input.suggestions.projectId !== projectId
//     ) {
//       throw new ProjectCacheValidationError("Full-project cache values must reference the same project.");
//     }

//     return [
//       {
//         key: buildProjectCacheKey("list", projectId, input.language),
//         value: withCacheLanguage(input.list, input.language),
//         schema: projectListItemSchema,
//       },
//       {
//         key: buildProjectCacheKey("details", projectId, input.language),
//         value: withCacheLanguage(input.details, input.language),
//         schema: projectRestDetailsSchema,
//       },
//       {
//         key: buildProjectCacheKey("suggestions", projectId, input.language),
//         value: withCacheLanguage(input.suggestions, input.language),
//         schema: projectSuggestionsSchema,
//       },
//     ];
//   }

//   /** Returns whichever of the six language/resource entries are present. */
//   async getCachedFullProject(projectId: string,): Promise<ProjectCacheReadResult<ProjectFullCacheResult>> {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const languages: ProjectCacheLanguage[] = ["en", "ar"];
//       const resources: ProjectCacheResource[] = [
//         "list",
//         "details",
//         "suggestions",
//       ];
//       const entries = languages.flatMap((language) =>
//         resources.map((resource) => ({
//           key: buildProjectCacheKey(resource, projectId, language),
//           schema:
//             resource === "list"
//               ? projectListItemSchema
//               : resource === "details"
//                 ? projectRestDetailsSchema
//                 : projectSuggestionsSchema,
//         })),
//       );

//       const readResult = await this.readEntries(entries);
//       if ("error" in readResult) return readResult;

//       const mapped = mapFullProjectCache(
//         readResult.data as Array<
//           ProjectListItem | ProjectRestDetails | ProjectSuggestions | null
//         >,
//       );

//       return this.validateGetterResult(projectFullCacheResultSchema, mapped);
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /** Returns all cached resources for one language, or null on a cache miss. */
//   async getCachedFullProjectLocalized(
//     projectId: string,
//     language: ProjectCacheLanguage,
//   ): Promise<
//     ProjectCacheReadResult<{
//       list?: ProjectListItem;
//       details?: ProjectRestDetails;
//       suggestions?: ProjectSuggestions;
//     } | null>
//   > {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const resources: ProjectCacheResource[] = [
//         "list",
//         "details",
//         "suggestions",
//       ];
//       const entries = resources.map((resource) => ({
//         key: buildProjectCacheKey(resource, projectId, language),
//         schema:
//           resource === "list"
//             ? projectListItemSchema
//             : resource === "details"
//               ? projectRestDetailsSchema
//               : projectSuggestionsSchema,
//       }));

//       const readResult = await this.readEntries(entries);
//       if ("error" in readResult) return readResult;

//       const [list, details, suggestions] = readResult.data as Array<
//         ProjectListItem | ProjectRestDetails | ProjectSuggestions | null
//       >;

//       const mapped =
//         list || details || suggestions
//           ? {
//             ...(list ? { list } : {}),
//             ...(details ? { details } : {}),
//             ...(suggestions ? { suggestions } : {}),
//           }
//           : null;

//       return this.validateGetterResult(
//         projectLocalizedFullCacheResultSchema,
//         mapped,
//       );
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /** Returns the Arabic and English list-item cache values for one project. */
//   async getCachedProjectItem(
//     projectId: string,
//   ): Promise<
//     ProjectCacheReadResult<import("./project-cache.types").ProjectItemsCacheResult>
//   > {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const readResult = await this.readEntries([
//         {
//           key: buildProjectCacheKey("list", projectId, "en"),
//           schema: projectListItemSchema,
//         },
//         {
//           key: buildProjectCacheKey("list", projectId, "ar"),
//           schema: projectListItemSchema,
//         },
//       ]);
//       if ("error" in readResult) return readResult;

//       const [english, arabic] = readResult.data as Array<ProjectListItem | null>;
//       const mapped = mapProjectItemsCache(english, arabic);
//       return this.validateGetterResult(projectItemsCacheResultSchema, mapped);
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /** Returns one language's list item, or null on a cache miss. */
//   async getCachedLocalizedProjectItem(
//     projectId: string,
//     language: ProjectCacheLanguage,
//   ): Promise<ProjectCacheReadResult<ProjectListItem | null>> {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const readResult = await this.readEntries([
//         {
//           key: buildProjectCacheKey("list", projectId, language),
//           schema: projectListItemSchema,
//         },
//       ]);
//       if ("error" in readResult) return readResult;

//       return this.validateGetterResult(
//         projectLocalizedItemCacheResultSchema,
//         readResult.data[0] ?? null,
//       );
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /** Returns the Arabic and English Details cache values for one project. */
//   async getCachedProjectDetails(
//     projectId: string,
//   ): Promise<
//     ProjectCacheReadResult<import("./project-cache.types").ProjectDetailsCacheResult>
//   > {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const readResult = await this.readEntries([
//         {
//           key: buildProjectCacheKey("details", projectId, "en"),
//           schema: projectRestDetailsSchema,
//         },
//         {
//           key: buildProjectCacheKey("details", projectId, "ar"),
//           schema: projectRestDetailsSchema,
//         },
//       ]);
//       if ("error" in readResult) return readResult;

//       const [english, arabic] = readResult.data as Array<ProjectRestDetails | null>;
//       const mapped = mapProjectDetailsCache(english, arabic);
//       return this.validateGetterResult(projectsCacheDetailsResultSchema, mapped);
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /** Returns one language's Details, or null on a cache miss. */
//   async getCachedLocalizedProjectDetails(
//     projectId: string,
//     language: ProjectCacheLanguage,
//   ): Promise<ProjectCacheReadResult<ProjectRestDetails | null>> {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const readResult = await this.readEntries([
//         {
//           key: buildProjectCacheKey("details", projectId, language),
//           schema: projectRestDetailsSchema,
//         },
//       ]);
//       if ("error" in readResult) return readResult;

//       return this.validateGetterResult(
//         projectLocalizedDetailsCacheResultSchema,
//         readResult.data[0] ?? null,
//       );
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /** Returns both language variants of a project's suggestions. */
//   async getCachedLocalizedProjectSuggestion(
//     projectId: string,
//   ): Promise<
//     ProjectCacheReadResult<import("./project-cache.types").ProjectSuggestionsCacheResult>
//   > {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const readResult = await this.readEntries([
//         {
//           key: buildProjectCacheKey("suggestions", projectId, "en"),
//           schema: projectSuggestionsSchema,
//         },
//         {
//           key: buildProjectCacheKey("suggestions", projectId, "ar"),
//           schema: projectSuggestionsSchema,
//         },
//       ]);
//       if ("error" in readResult) return readResult;

//       const [english, arabic] = readResult.data as Array<
//         ProjectSuggestions | null
//       >;
//       const mapped = mapProjectSuggestionsCache(english, arabic);
//       return this.validateGetterResult(
//         projectSuggestionsCacheResultSchema,
//         mapped,
//       );
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /** Returns one language's suggestions, or null on a cache miss. */
//   async getCachedLocalizedProjectSuggestionLocalized(
//     projectId: string,
//     language: ProjectCacheLanguage,
//   ): Promise<ProjectCacheReadResult<ProjectSuggestions | null>> {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

//       const readResult = await this.readEntries([
//         {
//           key: buildProjectCacheKey("suggestions", projectId, language),
//           schema: projectSuggestionsSchema,
//         },
//       ]);
//       if ("error" in readResult) return readResult;

//       return this.validateGetterResult(
//         projectLocalizedSuggestionsCacheResultSchema,
//         readResult.data[0] ?? null,
//       );
//     } catch (error) {
//       return { error: parseRedisError(error, "GET") };
//     }
//   }

//   /**
//    * Batch lookup. Missing cache entries are omitted; the order of the remaining
//    * entries follows projectIds. A duplicate project ID remains duplicated.
//    */
//   async getCachedProjectList(
//     projectIds: string[],
//   ): Promise<
//     ProjectCacheReadResult<import("./project-cache.types").ProjectListsCacheResult>
//   > {
//     try {
//       if (!Array.isArray(projectIds) || projectIds.some((id) => !hasProjectId(id))) {
//         return this.invalidProjectIdResult();
//       }
//       if (projectIds.length === 0) {
//         return this.validateGetterResult(projectListsCacheResultSchema, {
//           lists: { en: [], ar: [] },
//         });
//       }

//       const entries = projectIds.flatMap((projectId) => [
//         {
//           key: buildProjectCacheKey("list", projectId, "en"),
//           schema: projectListItemSchema,
//         },
//         {
//           key: buildProjectCacheKey("list", projectId, "ar"),
//           schema: projectListItemSchema,
//         },
//       ]);

//       const readResult = await this.readEntries(entries);
//       if ("error" in readResult) return readResult;

//       const english: ProjectListItem[] = [];
//       const arabic: ProjectListItem[] = [];

//       for (let index = 0; index < projectIds.length; index += 1) {
//         const en = readResult.data[index * 2] as ProjectListItem | null;
//         const ar = readResult.data[index * 2 + 1] as ProjectListItem | null;
//         if (en) english.push(en);
//         if (ar) arabic.push(ar);
//       }

//       const mapped = mapProjectListsCache(english, arabic);
//       return this.validateGetterResult(projectListsCacheResultSchema, mapped);
//     } catch (error) {
//       return { error: parseRedisError(error, "MGET") };
//     }
//   }

//   /** Batch lookup for one language. Missing cache entries are omitted. */
//   async getCachedLocalizedProjectList(
//     projectIds: string[],
//     language: ProjectCacheLanguage,
//   ): Promise<
//     ProjectCacheReadResult<import("./project-cache.types").LocalizedProjectListsCacheResult>
//   > {
//     try {
//       if (!Array.isArray(projectIds) || projectIds.some((id) => !hasProjectId(id))) {
//         return this.invalidProjectIdResult();
//       }
//       if (projectIds.length === 0) {
//         return this.validateGetterResult(projectLocalizedListsCacheResultSchema, {
//           lists: [],
//         });
//       }

//       const entries = projectIds.map((projectId) => ({
//         key: buildProjectCacheKey("list", projectId, language),
//         schema: projectListItemSchema,
//       }));

//       const readResult = await this.readEntries(entries);
//       if ("error" in readResult) return readResult;

//       const mapped = {
//         lists: readResult.data.filter(
//           (item): item is ProjectListItem => item !== null,
//         ),
//       };

//       return this.validateGetterResult(
//         projectLocalizedListsCacheResultSchema,
//         mapped,
//       );
//     } catch (error) {
//       return { error: parseRedisError(error, "MGET") };
//     }
//   }

//   /** Writes all three cache resources for both languages. */
//   async setCachedFullProject(
//     english: LocalizedProjectFullCacheWrite,
//     arabic: LocalizedProjectFullCacheWrite,
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => {
//       if (english.language !== "en" || arabic.language !== "ar") {
//         throw new ProjectCacheValidationError(
//           "The first full-project cache payload must be English and the second must be Arabic.",
//         );
//       }
//       return [
//         ...this.fullCacheEntries(english),
//         ...this.fullCacheEntries(arabic),
//       ];
//     });
//   }

//   async setCachedFullProjectEn(
//     data: ProjectFullCacheValue,
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => this.fullCacheEntries({ ...data, language: "en" }));
//   }

//   async setCachedFullProjectAr(
//     data: ProjectFullCacheValue,
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => this.fullCacheEntries({ ...data, language: "ar" }));
//   }

//   /** Writes one list item for both languages. */
//   async setCachedProjectList(
//     english: LocalizedProjectListCacheWrite,
//     arabic: LocalizedProjectListCacheWrite,
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => {
//       if (english.language !== "en" || arabic.language !== "ar") {
//         throw new ProjectCacheValidationError(
//           "The first list cache payload must be English and the second must be Arabic.",
//         );
//       }
//       if (english.list.id !== arabic.list.id) {
//         throw new ProjectCacheValidationError(
//           "English and Arabic list items must reference the same project.",
//         );
//       }
//       return [
//         {
//           key: buildProjectCacheKey("list", english.list.id, "en"),
//           value: withCacheLanguage(english.list, "en"),
//           schema: projectListItemSchema,
//         },
//         {
//           key: buildProjectCacheKey("list", arabic.list.id, "ar"),
//           value: withCacheLanguage(arabic.list, "ar"),
//           schema: projectListItemSchema,
//         },
//       ];
//     });
//   }

//   async setCachedProjectListEn(
//     data: { list: ProjectListCacheValue },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => [
//       {
//         key: buildProjectCacheKey("list", data.list.id, "en"),
//         value: withCacheLanguage(data.list, "en"),
//         schema: projectListItemSchema,
//       },
//     ]);
//   }

//   async setCachedProjectListAr(
//     data: { list: ProjectListCacheValue },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => [
//       {
//         key: buildProjectCacheKey("list", data.list.id, "ar"),
//         value: withCacheLanguage(data.list, "ar"),
//         schema: projectListItemSchema,
//       },
//     ]);
//   }

//   /** Writes details for both languages. */
//   async setCachedProjectDetails(
//     english: LocalizedProjectDetailsCacheWrite,
//     arabic: LocalizedProjectDetailsCacheWrite,
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => {
//       if (english.language !== "en" || arabic.language !== "ar") {
//         throw new ProjectCacheValidationError(
//           "The first details cache payload must be English and the second must be Arabic.",
//         );
//       }
//       if (english.details.id !== arabic.details.id) {
//         throw new ProjectCacheValidationError(
//           "English and Arabic details must reference the same project.",
//         );
//       }
//       return [
//         {
//           key: buildProjectCacheKey("details", english.details.id, "en"),
//           value: withCacheLanguage(english.details, "en"),
//           schema: projectRestDetailsSchema,
//         },
//         {
//           key: buildProjectCacheKey("details", arabic.details.id, "ar"),
//           value: withCacheLanguage(arabic.details, "ar"),
//           schema: projectRestDetailsSchema,
//         },
//       ];
//     });
//   }

//   async setCachedProjectDetailsEn(
//     data: { details: ProjectDetailsCacheValue },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => [
//       {
//         key: buildProjectCacheKey("details", data.details.id, "en"),
//         value: withCacheLanguage(data.details, "en"),
//         schema: projectRestDetailsSchema,
//       },
//     ]);
//   }

//   async setCachedProjectDetailsAr(
//     data: { details: ProjectDetailsCacheValue },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => [
//       {
//         key: buildProjectCacheKey("details", data.details.id, "ar"),
//         value: withCacheLanguage(data.details, "ar"),
//         schema: projectRestDetailsSchema,
//       },
//     ]);
//   }

//   /** Writes suggestions for both languages. */
//   async setCachedProjectSuggestions(
//     english: LocalizedProjectSuggestionsCacheWrite,
//     arabic: LocalizedProjectSuggestionsCacheWrite,
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => {
//       if (english.language !== "en" || arabic.language !== "ar") {
//         throw new ProjectCacheValidationError(
//           "The first suggestions cache payload must be English and the second must be Arabic.",
//         );
//       }
//       if (english.suggestions.projectId !== arabic.suggestions.projectId) {
//         throw new ProjectCacheValidationError(
//           "English and Arabic suggestions must reference the same project.",
//         );
//       }
//       return [
//         {
//           key: buildProjectCacheKey("suggestions", english.suggestions.projectId, "en"),
//           value: withCacheLanguage(english.suggestions, "en"),
//           schema: projectSuggestionsSchema,
//         },
//         {
//           key: buildProjectCacheKey("suggestions", arabic.suggestions.projectId, "ar"),
//           value: withCacheLanguage(arabic.suggestions, "ar"),
//           schema: projectSuggestionsSchema,
//         },
//       ];
//     });
//   }

//   async setCachedProjectSuggestionsEn(
//     data: { suggestions: ProjectSuggestionsCacheValue },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => [
//       {
//         key: buildProjectCacheKey("suggestions", data.suggestions.projectId, "en"),
//         value: withCacheLanguage(data.suggestions, "en"),
//         schema: projectSuggestionsSchema,
//       },
//     ]);
//   }

//   async setCachedProjectSuggestionsAr(
//     data: { suggestions: ProjectSuggestionsCacheValue },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => [
//       {
//         key: buildProjectCacheKey("suggestions", data.suggestions.projectId, "ar"),
//         value: withCacheLanguage(data.suggestions, "ar"),
//         schema: projectSuggestionsSchema,
//       },
//     ]);
//   }

//   /** Writes many list items for both languages in one Redis pipeline. */
//   async setCachedProjectItems(
//     english: LocalizedProjectItemsCacheWrite,
//     arabic: LocalizedProjectItemsCacheWrite,
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() => {
//       if (english.language !== "en" || arabic.language !== "ar") {
//         throw new ProjectCacheValidationError(
//           "The first list-items cache payload must be English and the second must be Arabic.",
//         );
//       }
//       const englishById = new Set(english.list.map((item) => item.id));
//       const arabicById = new Set(arabic.list.map((item) => item.id));

//       if (
//         englishById.size !== english.list.length ||
//         arabicById.size !== arabic.list.length ||
//         englishById.size !== arabicById.size ||
//         [...englishById].some((id) => !arabicById.has(id))
//       ) {
//         throw new ProjectCacheValidationError("English and Arabic list-item batches must contain the same unique project IDs.");
//       }

//       return [
//         ...english.list.map((item) => ({
//           key: buildProjectCacheKey("list", item.id, "en"),
//           value: withCacheLanguage(item, "en"),
//           schema: projectListItemSchema,
//         })),
//         ...arabic.list.map((item) => ({
//           key: buildProjectCacheKey("list", item.id, "ar"),
//           value: withCacheLanguage(item, "ar"),
//           schema: projectListItemSchema,
//         })),
//       ];
//     });
//   }

//   async setCachedProjectItemsEn(
//     data: { list: ProjectListCacheValue[] },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() =>
//       data.list.map((item) => ({
//         key: buildProjectCacheKey("list", item.id, "en"),
//         value: withCacheLanguage(item, "en"),
//         schema: projectListItemSchema,
//       })),
//     );
//   }

//   async setCachedProjectItemsAr(
//     data: { list: ProjectListCacheValue[] },
//   ): Promise<ProjectCacheWriteResult> {
//     return this.runWrite(() =>
//       data.list.map((item) => ({
//         key: buildProjectCacheKey("list", item.id, "ar"),
//         value: withCacheLanguage(item, "ar"),
//         schema: projectListItemSchema,
//       })),
//     );
//   }

//   /** Removes all six cache entries belonging to one project. */
//   async invalidateProject(projectId: string): Promise<ProjectCacheWriteResult> {
//     try {
//       if (!hasProjectId(projectId)) return this.invalidProjectIdWriteResult();
//       const result = await redisDeleteMany(buildProjectCacheKeys(projectId));
//       return "error" in result
//         ? { ok: false, error: result.error }
//         : { ok: true };
//     } catch (error) {
//       return { ok: false, error: parseRedisError(error, "DELETE") };
//     }
//   }

//   /** Removes all six cache entries for each supplied project ID. */
//   async invalidateProjects(projectIds: string[]): Promise<ProjectCacheWriteResult> {
//     try {
//       if (!Array.isArray(projectIds) || projectIds.some((id) => !hasProjectId(id))) {
//         return this.invalidProjectIdWriteResult();
//       }
//       const keys = projectIds.flatMap((projectId) =>
//         buildProjectCacheKeys(projectId),
//       );
//       const result = await redisDeleteMany(keys);
//       return "error" in result
//         ? { ok: false, error: result.error }
//         : { ok: true };
//     } catch (error) {
//       return { ok: false, error: parseRedisError(error, "DELETE") };
//     }
//   }
// }

// export const projectCacheService = new ProjectCacheService();

// modules/project/cache/project-cache.service.ts
import "server-only";

import {
  redisDeleteMany,
  redisGetManyJson,
  redisSetManyJson,
} from "@/infrastructure/redis/redis-operations";
import { parseRedisError } from "@/infrastructure/redis/redis-error-parser";
import type { RedisJsonEntry, RedisResult } from "@/infrastructure/redis/redis.types";
import type {
  ProjectListItem,
  ProjectRestDetails,
  ProjectSuggestions,
} from "@/modules/project/types";

import {
  projectListItemSchema,
  projectLocalizedFullCacheResultSchema,
  projectLocalizedItemCacheResultSchema,
  projectLocalizedListsCacheResultSchema,
  projectLocalizedSuggestionsCacheResultSchema,
  projectFullCacheResultSchema,
  projectItemsCacheResultSchema,
  projectListsCacheResultSchema,
  projectRestDetailsSchema,
  projectSuggestionsCacheResultSchema,
  projectSuggestionsSchema,
  projectLocalizedDetailsCacheResultSchema,
  projectsCacheDetailsResultSchema,
} from "./project-cache.schemas";
import {
  buildProjectCacheKey,
  buildProjectCacheKeys,
  getProjectCacheTtlSeconds,
  hasProjectId,
  withCacheLanguage,
} from "./project-cache.helpers";
import {
  mapFullProjectCache,
  mapProjectDetailsCache,
  mapProjectItemsCache,
  mapProjectListsCache,
  mapProjectSuggestionsCache,
} from "./project-cache.mapper";
import type {
  LocalizedProjectFullCacheWrite,
  LocalizedProjectItemsCacheWrite,
  LocalizedProjectListCacheWrite,
  LocalizedProjectDetailsCacheWrite,
  LocalizedProjectSuggestionsCacheWrite,
  ProjectCacheLanguage,
  ProjectCacheReadResult,
  ProjectCacheResource,
  ProjectCacheWriteResult,
  ProjectDetailsCacheValue,
  ProjectFullCacheValue,
  ProjectListCacheValue,
  ProjectSuggestionsCacheValue,
  ProjectFullCacheResult,
} from "./project-cache.types";

const INVALID_CACHE_DATA_MESSAGE =
  "Cached project data failed schema validation and was removed.";
const INVALID_WRITE_DATA_MESSAGE =
  "Project cache write data failed schema validation.";

interface CacheSchema {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: unknown };
}

class ProjectCacheValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectCacheValidationError";
  }
}

interface CacheReadEntry {
  key: string;
  schema: CacheSchema;
}

interface CacheWriteEntry {
  key: string;
  value: unknown;
  schema: CacheSchema;
}

/**
 * Project-scoped Redis cache for list items, localized details, and suggestions.
 * All public operations return a result object and contain operational errors.
 */
export class ProjectCacheService {
  private async readEntries(
    entries: CacheReadEntry[],
  ): Promise<RedisResult<unknown[]>> {
    try {
      if (entries.length === 0) return { data: [] };

      const redisResult = await redisGetManyJson<unknown>(
        entries.map((entry) => entry.key),
      );

      if ("error" in redisResult) return redisResult;

      const validValues: unknown[] = [];
      const invalidKeys: string[] = [];

      for (let index = 0; index < entries.length; index += 1) {
        const value = redisResult.data[index] ?? null;

        if (value === null) {
          validValues.push(null);
          continue;
        }

        const parsed = entries[index].schema.safeParse(value);

        if (!parsed.success) {
          invalidKeys.push(entries[index].key);
          validValues.push(null);
          continue;
        }

        validValues.push(parsed.data);
      }

      if (invalidKeys.length > 0) {
        const deleteResult = await redisDeleteMany(invalidKeys);
        if ("error" in deleteResult) return deleteResult;
        return { error: INVALID_CACHE_DATA_MESSAGE };
      }

      return { data: validValues };
    } catch (error) {
      return { error: parseRedisError(error, "MGET") };
    }
  }

  private async runWrite(
    buildEntries: () => CacheWriteEntry[],
  ): Promise<ProjectCacheWriteResult> {
    try {
      const entries = buildEntries();
      const validatedEntries: RedisJsonEntry<unknown>[] = [];

      for (const entry of entries) {
        const parsed = entry.schema.safeParse(entry.value);

        if (!parsed.success) {
          return { ok: false, error: INVALID_WRITE_DATA_MESSAGE };
        }

        validatedEntries.push({
          key: entry.key,
          value: parsed.data,
        });
      }

      const redisResult = await redisSetManyJson(
        validatedEntries,
        getProjectCacheTtlSeconds(),
      );

      if ("error" in redisResult) {
        return { ok: false, error: redisResult.error };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof ProjectCacheValidationError
            ? error.message
            : parseRedisError(error, "MSET"),
      };
    }
  }

  private validateGetterResult<T>(
    schema: CacheSchema,
    value: unknown,
  ): ProjectCacheReadResult<T> {
    try {
      const parsed = schema.safeParse(value);
      if (!parsed.success) {
        return { error: "Project cache result failed schema validation." };
      }
      return { data: parsed.data as T };
    } catch (error) {
      return { error: parseRedisError(error, "DESERIALIZE") };
    }
  }

  private invalidProjectIdResult(): { error: string } {
    return { error: "A valid project ID is required." };
  }

  private invalidProjectIdWriteResult(): ProjectCacheWriteResult {
    return { ok: false, error: "A valid project ID is required." };
  }

  private fullCacheEntries(
    input: LocalizedProjectFullCacheWrite,
  ): CacheWriteEntry[] {
    const projectId = input.list.id;

    if (
      input.details.id !== projectId ||
      input.suggestions.projectId !== projectId
    ) {
      throw new ProjectCacheValidationError("Full-project cache values must reference the same project.");
    }

    return [
      {
        key: buildProjectCacheKey("list", projectId, input.language),
        value: withCacheLanguage(input.list, input.language),
        schema: projectListItemSchema,
      },
      {
        key: buildProjectCacheKey("details", projectId, input.language),
        value: withCacheLanguage(input.details, input.language),
        schema: projectRestDetailsSchema,
      },
      {
        key: buildProjectCacheKey("suggestions", projectId, input.language),
        value: withCacheLanguage(input.suggestions, input.language),
        schema: projectSuggestionsSchema,
      },
    ];
  }

  /** Returns whichever of the six language/resource entries are present. */
  async getCachedFullProject(projectId: string,): Promise<ProjectCacheReadResult<ProjectFullCacheResult>> {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const languages: ProjectCacheLanguage[] = ["en", "ar"];
      const resources: ProjectCacheResource[] = [
        "list",
        "details",
        "suggestions",
      ];
      const entries = languages.flatMap((language) =>
        resources.map((resource) => ({
          key: buildProjectCacheKey(resource, projectId, language),
          schema:
            resource === "list"
              ? projectListItemSchema
              : resource === "details"
                ? projectRestDetailsSchema
                : projectSuggestionsSchema,
        })),
      );

      const readResult = await this.readEntries(entries);
      if ("error" in readResult) return readResult;

      const mapped = mapFullProjectCache(
        readResult.data as Array<
          ProjectListItem | ProjectRestDetails | ProjectSuggestions | null
        >,
      );

      return this.validateGetterResult(projectFullCacheResultSchema, mapped);
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /** Returns all cached resources for one language, or null on a cache miss. */
  async getCachedFullProjectLocalized(
    projectId: string,
    language: ProjectCacheLanguage,
  ): Promise<
    ProjectCacheReadResult<{
      list?: ProjectListItem;
      details?: ProjectRestDetails;
      suggestions?: ProjectSuggestions;
    } | null>
  > {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const resources: ProjectCacheResource[] = [
        "list",
        "details",
        "suggestions",
      ];
      const entries = resources.map((resource) => ({
        key: buildProjectCacheKey(resource, projectId, language),
        schema:
          resource === "list"
            ? projectListItemSchema
            : resource === "details"
              ? projectRestDetailsSchema
              : projectSuggestionsSchema,
      }));

      const readResult = await this.readEntries(entries);
      if ("error" in readResult) return readResult;

      const [list, details, suggestions] = readResult.data as Array<
        ProjectListItem | ProjectRestDetails | ProjectSuggestions | null
      >;

      const mapped =
        list || details || suggestions
          ? {
            ...(list ? { list } : {}),
            ...(details ? { details } : {}),
            ...(suggestions ? { suggestions } : {}),
          }
          : null;

      return this.validateGetterResult(
        projectLocalizedFullCacheResultSchema,
        mapped,
      );
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /** Returns the Arabic and English list-item cache values for one project. */
  async getCachedProjectItem(
    projectId: string,
  ): Promise<
    ProjectCacheReadResult<import("./project-cache.types").ProjectItemsCacheResult>
  > {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const readResult = await this.readEntries([
        {
          key: buildProjectCacheKey("list", projectId, "en"),
          schema: projectListItemSchema,
        },
        {
          key: buildProjectCacheKey("list", projectId, "ar"),
          schema: projectListItemSchema,
        },
      ]);
      if ("error" in readResult) return readResult;

      const [english, arabic] = readResult.data as Array<ProjectListItem | null>;
      const mapped = mapProjectItemsCache(english, arabic);
      return this.validateGetterResult(projectItemsCacheResultSchema, mapped);
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /** Returns one language's list item, or null on a cache miss. */
  async getCachedLocalizedProjectItem(
    projectId: string,
    language: ProjectCacheLanguage,
  ): Promise<ProjectCacheReadResult<ProjectListItem | null>> {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const readResult = await this.readEntries([
        {
          key: buildProjectCacheKey("list", projectId, language),
          schema: projectListItemSchema,
        },
      ]);
      if ("error" in readResult) return readResult;

      return this.validateGetterResult(
        projectLocalizedItemCacheResultSchema,
        readResult.data[0] ?? null,
      );
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /** Returns the Arabic and English Details cache values for one project. */
  async getCachedProjectDetails(
    projectId: string,
  ): Promise<
    ProjectCacheReadResult<import("./project-cache.types").ProjectDetailsCacheResult>
  > {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const readResult = await this.readEntries([
        {
          key: buildProjectCacheKey("details", projectId, "en"),
          schema: projectRestDetailsSchema,
        },
        {
          key: buildProjectCacheKey("details", projectId, "ar"),
          schema: projectRestDetailsSchema,
        },
      ]);
      if ("error" in readResult) return readResult;

      const [english, arabic] = readResult.data as Array<ProjectRestDetails | null>;
      const mapped = mapProjectDetailsCache(english, arabic);
      return this.validateGetterResult(projectsCacheDetailsResultSchema, mapped);
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /** Returns one language's Details, or null on a cache miss. */
  async getCachedLocalizedProjectDetails(
    projectId: string,
    language: ProjectCacheLanguage,
  ): Promise<ProjectCacheReadResult<ProjectRestDetails | null>> {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const readResult = await this.readEntries([
        {
          key: buildProjectCacheKey("details", projectId, language),
          schema: projectRestDetailsSchema,
        },
      ]);
      if ("error" in readResult) return readResult;

      return this.validateGetterResult(
        projectLocalizedDetailsCacheResultSchema,
        readResult.data[0] ?? null,
      );
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /** Returns both language variants of a project's suggestions. */
  async getCachedLocalizedProjectSuggestion(
    projectId: string,
  ): Promise<
    ProjectCacheReadResult<import("./project-cache.types").ProjectSuggestionsCacheResult>
  > {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const readResult = await this.readEntries([
        {
          key: buildProjectCacheKey("suggestions", projectId, "en"),
          schema: projectSuggestionsSchema,
        },
        {
          key: buildProjectCacheKey("suggestions", projectId, "ar"),
          schema: projectSuggestionsSchema,
        },
      ]);
      if ("error" in readResult) return readResult;

      const [english, arabic] = readResult.data as Array<
        ProjectSuggestions | null
      >;
      const mapped = mapProjectSuggestionsCache(english, arabic);
      return this.validateGetterResult(
        projectSuggestionsCacheResultSchema,
        mapped,
      );
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /** Returns one language's suggestions, or null on a cache miss. */
  async getCachedProjectSuggestionLocalized(
    projectId: string,
    language: ProjectCacheLanguage,
  ): Promise<ProjectCacheReadResult<ProjectSuggestions | null>> {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdResult();

      const readResult = await this.readEntries([
        {
          key: buildProjectCacheKey("suggestions", projectId, language),
          schema: projectSuggestionsSchema,
        },
      ]);
      if ("error" in readResult) return readResult;

      return this.validateGetterResult(
        projectLocalizedSuggestionsCacheResultSchema,
        readResult.data[0] ?? null,
      );
    } catch (error) {
      return { error: parseRedisError(error, "GET") };
    }
  }

  /**
   * Batch lookup. Missing cache entries are omitted; the order of the remaining
   * entries follows projectIds. A duplicate project ID remains duplicated.
   */
  async getCachedProjectList(
    projectIds: string[],
  ): Promise<
    ProjectCacheReadResult<import("./project-cache.types").ProjectListsCacheResult>
  > {
    try {
      if (!Array.isArray(projectIds) || projectIds.some((id) => !hasProjectId(id))) {
        return this.invalidProjectIdResult();
      }
      if (projectIds.length === 0) {
        return this.validateGetterResult(projectListsCacheResultSchema, {
          lists: { en: [], ar: [] },
        });
      }

      const entries = projectIds.flatMap((projectId) => [
        {
          key: buildProjectCacheKey("list", projectId, "en"),
          schema: projectListItemSchema,
        },
        {
          key: buildProjectCacheKey("list", projectId, "ar"),
          schema: projectListItemSchema,
        },
      ]);

      const readResult = await this.readEntries(entries);
      if ("error" in readResult) return readResult;

      const english: ProjectListItem[] = [];
      const arabic: ProjectListItem[] = [];

      for (let index = 0; index < projectIds.length; index += 1) {
        const en = readResult.data[index * 2] as ProjectListItem | null;
        const ar = readResult.data[index * 2 + 1] as ProjectListItem | null;
        if (en) english.push(en);
        if (ar) arabic.push(ar);
      }

      const mapped = mapProjectListsCache(english, arabic);
      return this.validateGetterResult(projectListsCacheResultSchema, mapped);
    } catch (error) {
      return { error: parseRedisError(error, "MGET") };
    }
  }

  /** Batch lookup for one language. Missing cache entries are omitted. */
  async getCachedLocalizedProjectList(
    projectIds: string[],
    language: ProjectCacheLanguage,
  ): Promise<
    ProjectCacheReadResult<import("./project-cache.types").LocalizedProjectListsCacheResult>
  > {
    try {
      if (!Array.isArray(projectIds) || projectIds.some((id) => !hasProjectId(id))) {
        return this.invalidProjectIdResult();
      }
      if (projectIds.length === 0) {
        return this.validateGetterResult(projectLocalizedListsCacheResultSchema, {
          lists: [],
        });
      }

      const entries = projectIds.map((projectId) => ({
        key: buildProjectCacheKey("list", projectId, language),
        schema: projectListItemSchema,
      }));

      const readResult = await this.readEntries(entries);
      if ("error" in readResult) return readResult;

      const mapped = {
        lists: readResult.data.filter(
          (item): item is ProjectListItem => item !== null,
        ),
      };

      return this.validateGetterResult(
        projectLocalizedListsCacheResultSchema,
        mapped,
      );
    } catch (error) {
      return { error: parseRedisError(error, "MGET") };
    }
  }

  /** Writes all three cache resources for both languages. */
  async setCachedFullProject(
    english: LocalizedProjectFullCacheWrite,
    arabic: LocalizedProjectFullCacheWrite,
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => {
      if (english.language !== "en" || arabic.language !== "ar") {
        throw new ProjectCacheValidationError(
          "The first full-project cache payload must be English and the second must be Arabic.",
        );
      }
      return [
        ...this.fullCacheEntries(english),
        ...this.fullCacheEntries(arabic),
      ];
    });
  }

  async setCachedFullProjectEn(
    data: ProjectFullCacheValue,
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => this.fullCacheEntries({ ...data, language: "en" }));
  }

  async setCachedFullProjectAr(
    data: ProjectFullCacheValue,
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => this.fullCacheEntries({ ...data, language: "ar" }));
  }

  /** Writes one list item for both languages. */
  async setCachedProjectList(
    english: LocalizedProjectListCacheWrite,
    arabic: LocalizedProjectListCacheWrite,
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => {
      if (english.language !== "en" || arabic.language !== "ar") {
        throw new ProjectCacheValidationError(
          "The first list cache payload must be English and the second must be Arabic.",
        );
      }
      if (english.list.id !== arabic.list.id) {
        throw new ProjectCacheValidationError(
          "English and Arabic list items must reference the same project.",
        );
      }
      return [
        {
          key: buildProjectCacheKey("list", english.list.id, "en"),
          value: withCacheLanguage(english.list, "en"),
          schema: projectListItemSchema,
        },
        {
          key: buildProjectCacheKey("list", arabic.list.id, "ar"),
          value: withCacheLanguage(arabic.list, "ar"),
          schema: projectListItemSchema,
        },
      ];
    });
  }

  async setCachedProjectListEn(
    data: { list: ProjectListCacheValue },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => [
      {
        key: buildProjectCacheKey("list", data.list.id, "en"),
        value: withCacheLanguage(data.list, "en"),
        schema: projectListItemSchema,
      },
    ]);
  }

  async setCachedProjectListAr(
    data: { list: ProjectListCacheValue },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => [
      {
        key: buildProjectCacheKey("list", data.list.id, "ar"),
        value: withCacheLanguage(data.list, "ar"),
        schema: projectListItemSchema,
      },
    ]);
  }

  /** Writes details for both languages. */
  async setCachedProjectDetails(
    english: LocalizedProjectDetailsCacheWrite,
    arabic: LocalizedProjectDetailsCacheWrite,
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => {
      if (english.language !== "en" || arabic.language !== "ar") {
        throw new ProjectCacheValidationError(
          "The first details cache payload must be English and the second must be Arabic.",
        );
      }
      if (english.details.id !== arabic.details.id) {
        throw new ProjectCacheValidationError(
          "English and Arabic details must reference the same project.",
        );
      }
      return [
        {
          key: buildProjectCacheKey("details", english.details.id, "en"),
          value: withCacheLanguage(english.details, "en"),
          schema: projectRestDetailsSchema,
        },
        {
          key: buildProjectCacheKey("details", arabic.details.id, "ar"),
          value: withCacheLanguage(arabic.details, "ar"),
          schema: projectRestDetailsSchema,
        },
      ];
    });
  }

  async setCachedProjectDetailsEn(
    data: { details: ProjectDetailsCacheValue },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => [
      {
        key: buildProjectCacheKey("details", data.details.id, "en"),
        value: withCacheLanguage(data.details, "en"),
        schema: projectRestDetailsSchema,
      },
    ]);
  }

  async setCachedProjectDetailsAr(
    data: { details: ProjectDetailsCacheValue },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => [
      {
        key: buildProjectCacheKey("details", data.details.id, "ar"),
        value: withCacheLanguage(data.details, "ar"),
        schema: projectRestDetailsSchema,
      },
    ]);
  }

  /** Writes suggestions for both languages. */
  async setCachedProjectSuggestions(
    english: LocalizedProjectSuggestionsCacheWrite,
    arabic: LocalizedProjectSuggestionsCacheWrite,
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => {
      if (english.language !== "en" || arabic.language !== "ar") {
        throw new ProjectCacheValidationError(
          "The first suggestions cache payload must be English and the second must be Arabic.",
        );
      }
      if (english.suggestions.projectId !== arabic.suggestions.projectId) {
        throw new ProjectCacheValidationError(
          "English and Arabic suggestions must reference the same project.",
        );
      }
      return [
        {
          key: buildProjectCacheKey("suggestions", english.suggestions.projectId, "en"),
          value: withCacheLanguage(english.suggestions, "en"),
          schema: projectSuggestionsSchema,
        },
        {
          key: buildProjectCacheKey("suggestions", arabic.suggestions.projectId, "ar"),
          value: withCacheLanguage(arabic.suggestions, "ar"),
          schema: projectSuggestionsSchema,
        },
      ];
    });
  }

  async setCachedProjectSuggestionsEn(
    data: { suggestions: ProjectSuggestionsCacheValue },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => [
      {
        key: buildProjectCacheKey("suggestions", data.suggestions.projectId, "en"),
        value: withCacheLanguage(data.suggestions, "en"),
        schema: projectSuggestionsSchema,
      },
    ]);
  }

  async setCachedProjectSuggestionsAr(
    data: { suggestions: ProjectSuggestionsCacheValue },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => [
      {
        key: buildProjectCacheKey("suggestions", data.suggestions.projectId, "ar"),
        value: withCacheLanguage(data.suggestions, "ar"),
        schema: projectSuggestionsSchema,
      },
    ]);
  }

  /** Writes many list items for both languages in one Redis pipeline. */
  async setCachedProjectItems(
    english: LocalizedProjectItemsCacheWrite,
    arabic: LocalizedProjectItemsCacheWrite,
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() => {
      if (english.language !== "en" || arabic.language !== "ar") {
        throw new ProjectCacheValidationError(
          "The first list-items cache payload must be English and the second must be Arabic.",
        );
      }
      const englishById = new Set(english.list.map((item) => item.id));
      const arabicById = new Set(arabic.list.map((item) => item.id));

      if (
        englishById.size !== english.list.length ||
        arabicById.size !== arabic.list.length ||
        englishById.size !== arabicById.size ||
        [...englishById].some((id) => !arabicById.has(id))
      ) {
        throw new ProjectCacheValidationError("English and Arabic list-item batches must contain the same unique project IDs.");
      }

      return [
        ...english.list.map((item) => ({
          key: buildProjectCacheKey("list", item.id, "en"),
          value: withCacheLanguage(item, "en"),
          schema: projectListItemSchema,
        })),
        ...arabic.list.map((item) => ({
          key: buildProjectCacheKey("list", item.id, "ar"),
          value: withCacheLanguage(item, "ar"),
          schema: projectListItemSchema,
        })),
      ];
    });
  }

  async setCachedProjectItemsEn(
    data: { list: ProjectListCacheValue[] },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() =>
      data.list.map((item) => ({
        key: buildProjectCacheKey("list", item.id, "en"),
        value: withCacheLanguage(item, "en"),
        schema: projectListItemSchema,
      })),
    );
  }

  async setCachedProjectItemsAr(
    data: { list: ProjectListCacheValue[] },
  ): Promise<ProjectCacheWriteResult> {
    return this.runWrite(() =>
      data.list.map((item) => ({
        key: buildProjectCacheKey("list", item.id, "ar"),
        value: withCacheLanguage(item, "ar"),
        schema: projectListItemSchema,
      })),
    );
  }

  /**
   * Removes selected resources for selected locales without disturbing the
   * remaining project cache entries. Used when mutations invalidate only a
   * subset of the project representation.
   */
  async invalidateProjectResources(
    projectId: string,
    resources: ProjectCacheResource[],
    languages: ProjectCacheLanguage[] = ["en", "ar"],
  ): Promise<ProjectCacheWriteResult> {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdWriteResult();

      const validResources = new Set<ProjectCacheResource>([
        "list",
        "details",
        "suggestions",
      ]);
      const validLanguages = new Set<ProjectCacheLanguage>(["en", "ar"]);

      if (
        !Array.isArray(resources) ||
        resources.some((resource) => !validResources.has(resource)) ||
        !Array.isArray(languages) ||
        languages.some((language) => !validLanguages.has(language))
      ) {
        return { ok: false, error: "Invalid project cache resources or languages." };
      }

      const keys = [...new Set(languages)].flatMap((language) =>
        [...new Set(resources)].map((resource) =>
          buildProjectCacheKey(resource, projectId, language),
        ),
      );
      const result = await redisDeleteMany(keys);

      return "error" in result
        ? { ok: false, error: result.error }
        : { ok: true };
    } catch (error) {
      return { ok: false, error: parseRedisError(error, "DELETE") };
    }
  }

  /** Removes all six cache entries belonging to one project. */
  async invalidateProject(projectId: string): Promise<ProjectCacheWriteResult> {
    try {
      if (!hasProjectId(projectId)) return this.invalidProjectIdWriteResult();
      const result = await redisDeleteMany(buildProjectCacheKeys(projectId));
      return "error" in result
        ? { ok: false, error: result.error }
        : { ok: true };
    } catch (error) {
      return { ok: false, error: parseRedisError(error, "DELETE") };
    }
  }

  /** Removes all six cache entries for each supplied project ID. */
  async invalidateProjects(projectIds: string[]): Promise<ProjectCacheWriteResult> {
    try {
      if (!Array.isArray(projectIds) || projectIds.some((id) => !hasProjectId(id))) {
        return this.invalidProjectIdWriteResult();
      }
      const keys = projectIds.flatMap((projectId) =>
        buildProjectCacheKeys(projectId),
      );
      const result = await redisDeleteMany(keys);
      return "error" in result
        ? { ok: false, error: result.error }
        : { ok: true };
    } catch (error) {
      return { ok: false, error: parseRedisError(error, "DELETE") };
    }
  }
}

export const projectCacheService = new ProjectCacheService();
