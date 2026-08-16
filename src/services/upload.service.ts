import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type { UploadResult } from "../types/security.types";

export const uploadService = {
  upload: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<ApiResponse<UploadResult>>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(res);
  },
};