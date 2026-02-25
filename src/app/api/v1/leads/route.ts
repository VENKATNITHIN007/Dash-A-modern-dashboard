import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, createLeadSchema } from "@/validations/api";

export const GET = withApiAuth(async (req, ctx) => {
  const leads = await ctx.db.lead.findMany({
    where: { deletedAt: null },
    include: {
      tags: { where: { deletedAt: null } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ data: leads });
});

export const POST = withApiAuth(async (req, ctx) => {
  const body = await req.json();
  const data = validateBody(createLeadSchema, body);

  const lead = await ctx.db.lead.create({
    data: {
      ...data,
      orgId: ctx.orgId,
    },
  });

  return NextResponse.json({ data: lead }, { status: 201 });
});
