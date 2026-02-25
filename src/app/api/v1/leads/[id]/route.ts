import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, updateLeadSchema } from "@/validations/api";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  const lead = await ctx.db.lead.findFirst({
    where: { id: ctx.params.id, deletedAt: null },
    include: {
      tags: { where: { deletedAt: null } },
      assignedTo: { select: { id: true, name: true, email: true } },
      activities: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 },
      notes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!lead) throw new NotFoundError("Lead not found");

  return NextResponse.json({ data: lead });
});

export const PATCH = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  const body = await req.json();
  const data = validateBody(updateLeadSchema, body);

  try {
    const lead = await ctx.db.lead.update({
      where: { id: ctx.params.id },
      data,
    });
    return NextResponse.json({ data: lead });
  } catch {
    throw new NotFoundError("Lead not found");
  }
});

export const DELETE = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  try {
    const lead = await ctx.db.lead.update({
      where: { id: ctx.params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ data: lead });
  } catch {
    throw new NotFoundError("Lead not found");
  }
});
