import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, createEmailLogSchema } from "@/validations/api";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId");

  const emails = await ctx.db.emailLog.findMany({
    where: {
      deletedAt: null,
      ...(leadId ? { leadId } : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: emails });
});

export const POST = withApiAuth(async (req, ctx) => {
  const body = await req.json();
  const data = validateBody(createEmailLogSchema, body);

  const lead = await ctx.db.lead.findFirst({
    where: { id: data.leadId, deletedAt: null },
  });

  if (!lead) {
    throw new NotFoundError("Lead not found");
  }

  const emailLog = await ctx.db.emailLog.create({
    data: {
      ...data,
      orgId: ctx.orgId,
      createdById: ctx.user.id,
      status: data.status || "sent",
    },
  });

  return NextResponse.json({ data: emailLog }, { status: 201 });
});
