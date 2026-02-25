import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, updateUserSchema } from "@/validations/api";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export const GET = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  const user = await ctx.db.user.findFirst({
    where: { id: ctx.params.id, deletedAt: null },
  });

  if (!user) throw new NotFoundError("User not found");

  return NextResponse.json({ data: user });
});

export const PATCH = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  if (ctx.user.role !== "admin" && ctx.user.role !== "superadmin" && ctx.user.role !== "manager" && ctx.user.id !== ctx.params.id) {
    throw new ForbiddenError("You do not have permission to update this user");
  }

  const body = await req.json();
  const data = validateBody(updateUserSchema, body);

  try {
    const user = await ctx.db.user.update({
      where: { id: ctx.params.id },
      data,
    });
    return NextResponse.json({ data: user });
  } catch {
    throw new NotFoundError("User not found");
  }
});

export const DELETE = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  if (ctx.user.role !== "admin" && ctx.user.role !== "superadmin" && ctx.user.role !== "manager") {
    throw new ForbiddenError("Only managers and admins can remove users");
  }

  try {
    const user = await ctx.db.user.update({
      where: { id: ctx.params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ data: user });
  } catch {
    throw new NotFoundError("User not found");
  }
});
