export type InvoiceStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export interface InvoiceAppointmentSummary {
  id: string;
  scheduledAt: string;
  clinicAddressSnapshot: string;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Invoice {
  id: string;
  appointmentId: string;
  invoiceNumber: string;
  amount: number | string;
  currency: string;
  status: InvoiceStatus;
  paymentMethod?: string | null;
  paidAt?: string | null;
  createdAt: string;
  appointment?: InvoiceAppointmentSummary;
}

export interface FilterInvoicesDto {
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
}
