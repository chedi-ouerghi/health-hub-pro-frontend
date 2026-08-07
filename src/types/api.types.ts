export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  code?: string;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  statusCode: number;
  code: string | undefined;
  path: string | undefined;
  timestamp: string | undefined;

  constructor(
    statusCode: number,
    message: string | string[],
    code?: string,
    path?: string,
    timestamp?: string,
  ) {
    const formattedMessage = Array.isArray(message) ? message.join(", ") : message;
    super(formattedMessage);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.path = path;
    this.timestamp = timestamp;
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
