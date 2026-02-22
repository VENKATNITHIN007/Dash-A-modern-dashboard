export const USER_ROLE_VALUES = ["superadmin", "admin", "manager", "agent"] as const;

export const UserRole = {
  superadmin: "superadmin",
  admin: "admin",
  manager: "manager",
  agent: "agent",
} as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  orgId: string;
  role: UserRole;
};

export type AuthSession = {
  user: SessionUser;
  session: {
    id: string;
    expiresAt: Date;
  };
};
