// // modules/projects/types.ts

// import { Language, ProjectFeatureScope, ProjectType, ProjectVisibility } from "@prisma/client";
// export type ProjectData = {
//     id: string;
//     title: string;
//     summary: string;
//     description: string;

//     targetUsers:string|null;
//     availableResources:string|null;
//     constraints:string|null;

//     yearPresentation?:string|null;
//     problemStatement: string ;
//     proposedSolution: string ;
    
//     language:Language

//     objectives: string ;
//     projectSupervisorName: string | null;
//     studentsPresented: string | null;

//     projectType: ProjectType; //(alias) type ProjectType = "GRADUATION" | "PRE_GRADUATION"
//     visibility: ProjectVisibility;//(alias) type ProjectVisibility = "VISIBLE" | "HIDDEN"
//     createdAt: Date;
//     updatedAt: Date;
//     features: {
//         id: string;
//         content: string;
//         scope: ProjectFeatureScope; //(alias) type ProjectFeatureScope = "IN_SCOPE" | "OUT_OF_SCOPE"
//         sortOrder: number;
//     }[];
//     technologies: {
//         id: string;
//         name: string;
//         sortOrder: number;
//     }[];
//     images: {
//         sortOrder: number;
//         id: string;
//         mimeType: string;
//         fileName: string | null;
//         fileSizeBytes: number;
//         createdAt: Date;
//     }[];
//     counts: {
//         images: number;
//         suggestions: number;
//     }
// }

// export type ProjectListItem = {
//     id: string;
//     language:Locale; //"en" | "ar"
//     title: string;
//     summary: string;
//     projectSupervisorName: string | null;
//     projectType: ProjectType; //(alias) type ProjectType = "PRE_GRADUATION" | "GRADUATION"
//     visibility: ProjectVisibility;//(alias) type ProjectVisibility = "VISIBLE" | "HIDDEN"
//     technologies: {
//         id: string;
//         name: string;
//         sortOrder: number;
//     }[];
//     images: { id: string; mimeType: string }[];
//     counts: {
//       images: number;
//       suggestions: number;
//     };
//   };
// export type ProjectRestDetails ={ // Redis Purpose.
//     id: string;
//     language:Locale; //"en" | "ar"
//     description: string;
//     targetUsers:string|null;
//     availableResources:string|null;
//     constraints:string|null;
//     yearPresentation?:string|null;
//     problemStatement: string ;
//     proposedSolution: string ;
//     objectives: string ;
//     createdAt: Date;
//     updatedAt: Date;
//     features: {
//         id: string;
//         content: string;
//         scope: ProjectFeatureScope; //(alias) type ProjectFeatureScope = "IN_SCOPE" | "OUT_OF_SCOPE"
//         sortOrder: number;
//     }[];
// }

// export type Suggestion = {
//     id: string;
//     title: string;
//     createdAt: Date;
//     content: string;
// }

// export type ProjectSuggestions ={
//     projectId:string,
//     language:Locale; //"en" | "ar"
//     suggestions:Suggestion[]
// }


import type {
    Language,
    ProjectFeatureScope,
    ProjectType,
    ProjectVisibility,
  } from "@prisma/client";
  
  export type Locale = "en" | "ar";
  
  export type ProjectData = {
    id: string;
    title: string;
    summary: string;
    description: string;
  
    targetUsers: string | null;
    availableResources: string | null;
    constraints: string | null;
  
    yearPresentation?: string | null;
    problemStatement: string;
    proposedSolution: string;
    language: Language;
  
    objectives: string;
    projectSupervisorName: string | null;
    studentsPresented: string | null;
  
    projectType: ProjectType;
    visibility: ProjectVisibility;
    createdAt: Date;
    updatedAt: Date;
    features: {
      id: string;
      content: string;
      scope: ProjectFeatureScope;
      sortOrder: number;
    }[];
    technologies: {
      id: string;
      name: string;
      sortOrder: number;
    }[];
    images: {
      sortOrder: number;
      id: string;
      mimeType: string;
      fileName: string | null;
      fileSizeBytes: number;
      createdAt: Date;
    }[];
    counts: {
      images: number;
      suggestions: number;
    };
  };
  
  /** List cache resource. Includes the complete project image metadata. */
  export type ProjectListItem = {
    id: string;
    language: Locale;
    title: string;
    summary: string;
    projectSupervisorName: string | null;
    projectType: ProjectType;
    visibility: ProjectVisibility;
    technologies: {
      id: string;
      name: string;
      sortOrder: number;
    }[];
    images: ProjectData["images"];
    counts: {
      images: number;
      suggestions: number;
    };
  };
  
  /** Details cache resource. Includes fields needed to rebuild ProjectData. */
  export type ProjectRestDetails = {
    id: string;
    language: Locale;
    description: string;
    targetUsers: string | null;
    availableResources: string | null;
    constraints: string | null;
    yearPresentation?: string | null;
    problemStatement: string;
    proposedSolution: string;
    objectives: string;
    studentsPresented: string | null;
    createdAt: Date;
    updatedAt: Date;
    features: {
      id: string;
      content: string;
      scope: ProjectFeatureScope;
      sortOrder: number;
    }[];
  };
  
  export type Suggestion = {
    id: string;
    title: string;
    createdAt: Date;
    content: string;
  };
  
  export type ProjectSuggestions = {
    projectId: string;
    language: Locale;
    suggestions: Suggestion[];
  };
  


export type ExtractedProject ={
  title:string;
  summary: string;
  description: string;
  targetUsers?:string | null,    
  availableResources?:string | null,
  constraints?:string | null,    
  objectives?: string | null;
  yearPresentation?:string|null;
  problemStatement?: string | null;
  proposedSolution?: string | null;
  projectSupervisorName?: string | null;
  studentsPresented?: string | null;
  language:Language;
  projectType:"Pre-Graduation" | "Pre Graduation" | "pre-graduation" | "pre graduation"| "Graduation" | "graduation",
  inScopeFeatures:{
      content:string,
  }[],
  outScopeFeatures:{
      content:string,
  }[],
  technologies:{
      content:string,
  }[],
}