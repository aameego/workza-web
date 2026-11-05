import { api, type ApiBlobResult } from "../lib/apiClient";
import {
  fileNameFromContentDisposition,
  saveDownload,
} from "../lib/saveDownload";
import { letterDataOf } from "./letterEnvelope";
import type { IssueLetterPayload, IssueLetterResult } from "./letterTypes";

export const issueLetter = async (
  payload: IssueLetterPayload,
): Promise<IssueLetterResult> => {
  const body = await api.post<unknown>("/letters/issue", { json: payload });
  const data = letterDataOf<IssueLetterResult>(body) || {};
  return {
    ...data,
    emailed: Boolean(data.letter?.emailedAt),
  };
};

export const downloadIssuedLetter = async (
  id: string,
  fallbackName = `letter-${id}.pdf`,
): Promise<void> => {
  const result: ApiBlobResult = await api.getBlob(`/letters/${id}/download`);
  const name = fileNameFromContentDisposition(
    result.headers.get("content-disposition"),
    fallbackName,
  );
  await saveDownload(result.blob, name);
};
