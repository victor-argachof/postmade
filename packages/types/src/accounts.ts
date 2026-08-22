export type IdentityProvider = "password" | "google";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  identity: {
    provider: IdentityProvider;
    emailVerified: boolean;
  };
  createdAt: string;
}

export interface ChallengeResponse {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}

export interface UpdateProfileInput {
  name: string;
}
export interface StartEmailChangeInput {
  newEmail: string;
}
export interface VerifyEmailChangeInput {
  challengeId: string;
  code: string;
}
export interface ResendEmailChangeInput {
  challengeId: string;
}
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
