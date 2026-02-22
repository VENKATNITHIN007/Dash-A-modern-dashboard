import { z } from "zod";
import { USER_ROLE_VALUES } from "@/types/auth";

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().url().optional(),
  orgId: z.string().uuid(),
  role: z.enum(USER_ROLE_VALUES),
});
