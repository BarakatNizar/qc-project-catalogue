import { ProjectFeatureScope, ProjectType, ProjectVisibility } from "@prisma/client";
export type ProjectDto = {
    id: string;
    title: string;
    summary: string;
    description: string;

    targetUsers:string|null;
    availableResources:string|null;
    constraints:string|null;

    yearPresentation?:string|null;
    problemStatement: string ;
    proposedSolution: string ;
    objectives: string ;
    projectSupervisorName: string | null;
    projectType: ProjectType; //(alias) type ProjectType = "GRADUATION" | "PRE_GRADUATION"
    visibility: ProjectVisibility;//(alias) type ProjectVisibility = "VISIBLE" | "HIDDEN"
    createdAt: Date;
    updatedAt: Date;
    features: {
        id: string;
        content: string;
        scope: ProjectFeatureScope; //(alias) type ProjectFeatureScope = "IN_SCOPE" | "OUT_OF_SCOPE"
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
    }
}

export type ExtractedProject ={
    title:string;
    summary: string;
    description: string;
    targetUsers?:string|null,    
    availableResources?:string|null,
    constraints?:string|null,    
    objectives?: string | null;
    yearPresentation?:string|null;
    problemStatement?: string | null;
    proposedSolution?: string | null;
    projectSupervisorName: string;
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