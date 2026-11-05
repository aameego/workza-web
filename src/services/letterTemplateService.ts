import { api } from "../lib/apiClient";
import { letterDataOf } from "./letterEnvelope";
import type { LetterTemplate, LetterTemplateSummary } from "./letterTypes";

export const getLetterTemplates = async (
  params: {
    recipientType?: string;
    status?: string;
    archived?: boolean | string;
  } = {},
): Promise<LetterTemplateSummary[]> => {
  const body = await api.get<unknown>("/letter-templates", { params });
  const data = letterDataOf<LetterTemplateSummary[] | null>(body);
  return Array.isArray(data) ? data : [];
};

export const getLetterTemplate = async (id: string): Promise<LetterTemplate> => {
  const body = await api.get<unknown>(`/letter-templates/${id}`);
  return letterDataOf<LetterTemplate>(body);
};
