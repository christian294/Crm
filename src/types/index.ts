export type ApiResponse<T> = {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};

export type ApiError = {
  error: string;
};

export type SearchParams = {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: string;
  limit?: string;
  [key: string]: string | undefined;
};
