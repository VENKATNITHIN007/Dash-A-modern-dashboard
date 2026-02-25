import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, createActivitySchema } from "@/validations/api";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId");

  const activities = await ctx.db.activity.findMany({
    where: {
      deletedAt: null,
      ...(leadId ? { leadId } : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: activities });
});

export const POST = withApiAuth(async (req, ctx) => {
  const body = await req.json();
  const data = validateBody(createActivitySchema, body);

  const lead = await ctx.db.lead.findFirst({
    where: { id: data.leadId, deletedAt: null },
  });

  if (!lead) {
    throw new NotFoundError("Lead not found");
  }

  const activity = await ctx.db.activity.create({
    data: {
      ...data,
      orgId: ctx.orgId,
      createdById: ctx.user.id,
    },
  });

  return NextResponse.json({ data: activity }, { status: 201 });
});
