import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, createTagSchema } from "@/validations/api";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ data: [] });
  }

  const tags = await ctx.db.leadTag.findMany({
    where: { leadId, deletedAt: null },
  });

  return NextResponse.json({ data: tags });
});

export const POST = withApiAuth(async (req, ctx) => {
  const body = await req.json();
  const data = validateBody(createTagSchema, body);

  const lead = await ctx.db.lead.findFirst({
    where: { id: data.leadId, deletedAt: null },
  });

  if (!lead) {
    throw new NotFoundError("Lead not found");
  }

  // Use findFirst instead of findUnique because tenant wrapper only supports findUnique on id easily if we aren't careful, but let's check:
  // We can use findFirst
  const existingTag = await ctx.db.leadTag.findFirst({
    where: { leadId: data.leadId, name: data.name },
  });

  if (existingTag) {
    if (existingTag.deletedAt !== null) {
      // restore soft deleted tag
      const restored = await ctx.db.leadTag.update({
        where: { id: existingTag.id },
        data: { deletedAt: null },
      });
      return NextResponse.json({ data: restored }, { status: 200 });
    }
    return NextResponse.json({ data: existingTag }, { status: 200 });
  }

  const tag = await ctx.db.leadTag.create({
    data: {
      name: data.name,
      leadId: data.leadId,
      orgId: ctx.orgId,
    },
  });

  return NextResponse.json({ data: tag }, { status: 201 });
});
