export type ApiStatus = '0000' | '9999';

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface ApiEnvelope<T> {
  status: ApiStatus;
  message: string;
  data: T | null;
  errors: Record<string, unknown>;
  meta: PaginationMeta | Record<string, unknown>;
}

