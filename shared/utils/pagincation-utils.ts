

export type PaginationMeta={
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    prevPages: number[];
    nextPages: number[];
}


export function getPaginationMeta(totalCount: number, page: number, pageSize: number):PaginationMeta {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    
    const prevPages: number[] = [];
    for (let i = Math.max(1, currentPage - 2); i < currentPage; i++) {
      prevPages.push(i);
    }
  
    const nextPages: number[] = [];
    for (let i = currentPage + 1; i <= Math.min(totalPages, currentPage + 2); i++) {
      nextPages.push(i);
    }
  
    return {
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      prevPages,
      nextPages,
    };
  }