import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, createOrgSchema } from "@/validations/api";
import { ForbiddenError } from "@/lib/errors";

export const GET = withApiAuth(async (req, ctx) => {
  const organizations = await ctx.db.organization.findMany();
  return NextResponse.json({ data: organizations });
});

export const POST = withApiAuth(async (req, ctx) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "superadmin") {
    throw new ForbiddenError("Only admins can create organizations");
  }

  const body = await req.json();
  const data = validateBody(createOrgSchema, body);

  const organization = await ctx.db.organization.create({
    data,
  });

  return NextResponse.json({ data: organization }, { status: 201 });
});
