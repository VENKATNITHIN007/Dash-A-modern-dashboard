import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

export const DELETE = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  try {
    const tag = await ctx.db.leadTag.update({
      where: { id: ctx.params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ data: tag });
  } catch {
    throw new NotFoundError("Tag not found");
  }
});
