export type Role = "ADMIN" | "MEMBER";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  organizations: {
    orgId: string;
    role: Role;
    createdAt: string;
    org: { id: string; name: string };
  }[];
}
