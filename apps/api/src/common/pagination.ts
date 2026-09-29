export interface PaginationQuery {
  page?: string | number;
  pageSize?: string | number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PagedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}

const defaultPage = 1;
const defaultPageSize = 25;
const maxPageSize = 100;

export function parsePagination(query: PaginationQuery): Pagination {
  const page = positiveInteger(query.page, defaultPage);
  const requestedPageSize = positiveInteger(query.pageSize, defaultPageSize);
  const pageSize = Math.min(requestedPageSize, maxPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function pagedResponse<T>(data: T[], total: number, pagination: Pagination): PagedResponse<T> {
  return {
    data,
    meta: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pagination.pageSize))
    }
  };
}

function positiveInteger(value: string | number | undefined, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
