import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicesKeys } from "../../lib/api/query-keys";
import { invoicesService } from "../../services/invoices.service";
import { useAuthStore } from "../../stores/auth-store";
import type { FilterInvoicesDto } from "../../types/invoice.types";

export function useInvoicesQuery(filters?: FilterInvoicesDto) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: invoicesKeys.list(filters),
    queryFn: () => invoicesService.listMine(filters),
    enabled: Boolean(user),
  });
}

export function useInvoiceQuery(id: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: invoicesKeys.detail(id),
    queryFn: () => invoicesService.getById(id),
    enabled: Boolean(id) && Boolean(user),
  });
}

export function useMarkInvoicePaidMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesService.markPaid(id),
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: invoicesKeys.all });
      if (updatedInvoice.id) {
        queryClient.invalidateQueries({
          queryKey: invoicesKeys.detail(updatedInvoice.id),
        });
      }
    },
  });
}
