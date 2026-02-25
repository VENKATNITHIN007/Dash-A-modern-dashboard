import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, updateOrgSchema } from "@/validations/api";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  const organization = await ctx.db.organization.findUnique({
    where: { id: ctx.params.id },
  });

  if (!organization) throw new NotFoundError("Organization not found");

  return NextResponse.json({ data: organization });
});

export const PATCH = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  const body = await req.json();
  const data = validateBody(updateOrgSchema, body);

  try {
    const organization = await ctx.db.organization.update({
      where: { id: ctx.params.id },
      data,
    });
    return NextResponse.json({ data: organization });
  } catch {
    throw new NotFoundError("Organization not found");
  }
});

export const DELETE = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  try {
    const organization = await ctx.db.organization.update({
      where: { id: ctx.params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ data: organization });
  } catch {
    throw new NotFoundError("Organization not found");
  }
});
