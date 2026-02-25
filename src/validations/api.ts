import { z } from "zod";
import { ValidationError } from "@/lib/errors";
import { USER_ROLE_VALUES } from "@/types/auth";

export function validateBody<T>(schema: z.Schema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(
      "Validation failed",
      result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }))
    );
  }
  return result.data;
}

// Organizations
export const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const updateOrgSchema = createOrgSchema.partial();

// Users
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  role: z.enum(USER_ROLE_VALUES).default("agent"),
});

export const updateUserSchema = createUserSchema.partial();

// Leads
export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.enum(["new", "contacted", "hot", "closed", "lost"]).default("new"),
  assignedToId: z.string().uuid().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

// Activities
export const createActivitySchema = z.object({
  leadId: z.string().uuid(),
  type: z.string().min(1, "Type is required"),
  content: z.string().optional().nullable(),
});

// Notes
export const createNoteSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().min(1, "Body is required"),
});

export const updateNoteSchema = z.object({
  body: z.string().min(1, "Body is required"),
});

// Tags
export const createTagSchema = z.object({
  leadId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
});

// Email Logs
export const createEmailLogSchema = z.object({
  leadId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});
