import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "../types/api.types";
import type { FilterInvoicesDto, Invoice } from "../types/invoice.types";

export const invoicesService = {
  listMine: async (params?: FilterInvoicesDto): Promise<PaginatedResponse<Invoice>> => {
    const res = await apiClient.get<ApiResponse<{ invoices: Invoice[]; meta: PaginationMeta }>>(
      "/invoices/me",
      { params },
    );
    const result = unwrap(res);
    return { data: result.invoices, meta: result.meta };
  },

  getById: async (id: string): Promise<Invoice> => {
    const res = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return unwrap(res);
  },

  markPaid: async (id: string): Promise<Invoice> => {
    const res = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/mark-paid`);
    return unwrap(res);
  },
};
