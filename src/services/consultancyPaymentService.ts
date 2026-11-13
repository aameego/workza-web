import { api } from "../lib/apiClient";

export type ConsultancyPayment = {
  amount?: number;
  tdsPercent?: number;
  tdsAmount?: number;
  netAmount?: number;
  status?: "Paid" | "Pending" | string;
};

export type ConsultancyPaymentsResponse = {
  rows?: { employee?: { _id?: string }; payment: ConsultancyPayment }[];
  summary?: {
    totalConsultants?: number;
    totalPayable?: number;
    totalTDS?: number;
    totalNetPayable?: number;
    paidAmount?: number;
    pendingAmount?: number;
  };
};

/** One month's consultancy payments: a row per active consultant plus totals. */
export const getConsultancyPayments = (month: number, year: number) =>
  api.get<ConsultancyPaymentsResponse>("/consultancy-payments", { params: { month, year } });

export const saveConsultancyPayment = (payload: {
  employeeId: string;
  month: number;
  year: number;
  amount?: number;
  tdsPercent?: number;
  status?: "Paid" | "Pending";
}) => api.put("/consultancy-payments", { json: payload });
