import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, createNoteSchema } from "@/validations/api";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ data: [] });
  }

  const notes = await ctx.db.note.findMany({
    where: { leadId, deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: notes });
});

export const POST = withApiAuth(async (req, ctx) => {
  const body = await req.json();
  const data = validateBody(createNoteSchema, body);

  const lead = await ctx.db.lead.findFirst({
    where: { id: data.leadId, deletedAt: null },
  });

  if (!lead) {
    throw new NotFoundError("Lead not found");
  }

  const note = await ctx.db.note.create({
    data: {
      ...data,
      orgId: ctx.orgId,
      createdById: ctx.user.id,
    },
  });

  return NextResponse.json({ data: note }, { status: 201 });
});
