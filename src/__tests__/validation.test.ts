import { describe, it, expect } from "vitest";
import { sessionUserSchema } from "@/validations/auth";
import { UserRole } from "@/types/auth";

describe("sessionUserSchema", () => {
  it("validates a correct session user", () => {
    const validUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      name: "Test User",
      orgId: "550e8400-e29b-41d4-a716-446655440001",
      role: UserRole.agent,
    };
    const result = sessionUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects a user with missing orgId", () => {
    const invalidUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      name: "Test User",
      role: UserRole.agent,
    };
    const result = sessionUserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("orgId");
    }
  });

  it("rejects an invalid email", () => {
    const invalidUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "not-an-email",
      name: "Test User",
      orgId: "550e8400-e29b-41d4-a716-446655440001",
      role: UserRole.agent,
    };
    const result = sessionUserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});
