import { api } from "../lib/apiClient";

export type LoginPayload = {
  emailOrPhone: string;
  password: string;
  vendorCode: string;
  otp?: string;
};

export type LoginUser = {
  vendorName?: string | null;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

export type LoginSuccess = {
  token: string;
  user: LoginUser;
  organisations?: unknown[];
  twoFactorRequired?: false;
};

export type LoginTwoFactor = {
  twoFactorRequired: true;
  sendTo?: string;
  message?: string;
};

export type LoginResult = LoginSuccess | LoginTwoFactor;

const authPath = (segment: string) => `/auth/${segment.replace(/^\//, "")}`;

export const loginUser = async (payload: LoginPayload): Promise<LoginResult> =>
  api.post<LoginResult>(authPath("login"), {
    json: payload,
    skipAuthRedirect: true,
  });

export type SendOtpPayload = {
  emailOrPhone: string;
  vendorCode: string;
};

export const sendOtp = async (payload: SendOtpPayload) =>
  api.post(authPath("send-otp"), {
    json: payload,
    skipAuthRedirect: true,
  });

export type VerifyOtpPayload = {
  emailOrPhone: string;
  otp: string;
  vendorCode: string;
};

export const verifyOtp = async ({
  emailOrPhone,
  otp,
  vendorCode,
}: VerifyOtpPayload) =>
  api.get(
    authPath(
      `verify-otp?emailOrPhone=${encodeURIComponent(emailOrPhone)}&otp=${encodeURIComponent(otp)}&vendorCode=${encodeURIComponent(vendorCode)}`,
    ),
    { skipAuthRedirect: true },
  );

export type UpdatePasswordPayload = {
  emailOrPhone: string;
  newPassword: string;
  confirmPassword: string;
  vendorCode: string;
};

export const updatePassword = async (payload: UpdatePasswordPayload) =>
  api.patch(authPath("update-password"), {
    json: payload,
    skipAuthRedirect: true,
  });
