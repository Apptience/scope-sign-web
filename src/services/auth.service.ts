import { api } from "./api";

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  agencyName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export const authService = {
  async signup(input: SignupInput) {
    const response = await api.post("/auth.signup", {
      name: input.name,
      email: input.email,
      password: input.password,
      agencyName: input.agencyName,
      country: "US",
      currency: "USD",
    });
    return response.data;
  },

  async login(input: LoginInput) {
    const response = await api.post("/auth.login", {
      email: input.email,
      password: input.password,
    });
    return response.data;
  },

  async verifyOtp(input: VerifyOtpInput) {
    const response = await api.post("/auth.verifyOtp", {
      email: input.email,
      code: input.code,
    });
    return response.data;
  },

  async resendOtp(email: string) {
    const response = await api.post("/auth.resendOtp", {
      email,
    });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post("/auth.forgotPassword", {
      email,
    });
    return response.data;
  },

  async resetPassword(input: ResetPasswordInput) {
    const response = await api.post("/auth.resetPassword", {
      email: input.email,
      code: input.code,
      newPassword: input.newPassword,
    });
    return response.data;
  },
};
