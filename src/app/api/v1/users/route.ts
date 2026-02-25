import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, createUserSchema } from "@/validations/api";
import { ForbiddenError } from "@/lib/errors";

export const GET = withApiAuth(async (req, ctx) => {
  const users = await ctx.db.user.findMany({
    where: { deletedAt: null },
  });
  return NextResponse.json({ data: users });
});

export const POST = withApiAuth(async (req, ctx) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "superadmin" && ctx.user.role !== "manager") {
    throw new ForbiddenError("Only managers and admins can invite users");
  }

  const body = await req.json();
  const data = validateBody(createUserSchema, body);

  const user = await ctx.db.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      orgId: ctx.orgId,
    },
  });

  return NextResponse.json({ data: user }, { status: 201 });
});
