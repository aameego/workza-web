import { api } from "../lib/apiClient";

export type ProbationPolicy = {
  probationMonths: number;
  noticeDaysProbation: number;
  noticeDaysConfirmed: number;
  autoConfirmEnabled: boolean;
};

export type ProbationPolicyUpdate = {
  probationMonths: number;
  noticeDaysProbation: number;
  noticeDaysConfirmed: number;
  autoConfirmEnabled: boolean;
};

export type AutoConfirmResult = {
  message: string;
  confirmed: number;
  backfilled: number;
};

/** GET /api/probation/policy — unlike most endpoints, this returns { policy } directly. */
export const getProbationPolicy = async (): Promise<ProbationPolicy> => {
  const data = await api.get<{ policy: ProbationPolicy }>("/probation/policy");
  return data.policy;
};

/** PUT /api/probation/policy — returns { message, policy }. */
export const updateProbationPolicy = async (
  payload: ProbationPolicyUpdate,
): Promise<ProbationPolicy> => {
  const data = await api.put<{ message: string; policy: ProbationPolicy }>(
    "/probation/policy",
    { json: payload },
  );
  return data.policy;
};

/** POST /api/probation/auto-confirm/run — Admin-only manual trigger. */
export const runProbationAutoConfirmNow = async (): Promise<AutoConfirmResult> => {
  const data = await api.post<AutoConfirmResult>("/probation/auto-confirm/run", {
    json: {},
  });
  return data;
};
