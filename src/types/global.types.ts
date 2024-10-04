export interface ApiResponse<T> {
  message: string;
  data: T;
  success: boolean;
}

export interface PaginatedApiResponse<T> {
  message: string;
  data: {
    currentPage: number;
    count: number;
    pageCount: number;
    results: T[];
  };
  success: boolean;
}
