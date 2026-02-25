import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-handler";
import { validateBody, updateNoteSchema } from "@/validations/api";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export const PATCH = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  const body = await req.json();
  const data = validateBody(updateNoteSchema, body);

  const note = await ctx.db.note.findFirst({
    where: { id: ctx.params.id, deletedAt: null },
  });

  if (!note) {
    throw new NotFoundError("Note not found");
  }

  if (note.createdById !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "superadmin") {
    throw new ForbiddenError("You can only edit your own notes");
  }

  try {
    const updatedNote = await ctx.db.note.update({
      where: { id: ctx.params.id },
      data,
    });
    return NextResponse.json({ data: updatedNote });
  } catch {
    throw new NotFoundError("Note not found");
  }
});

export const DELETE = withApiAuth<{ id: string }>(async (req, ctx) => {
  if (!ctx.params?.id) throw new NotFoundError();
  
  const note = await ctx.db.note.findFirst({
    where: { id: ctx.params.id, deletedAt: null },
  });

  if (!note) {
    throw new NotFoundError("Note not found");
  }

  if (note.createdById !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "superadmin") {
    throw new ForbiddenError("You can only delete your own notes");
  }

  try {
    const deletedNote = await ctx.db.note.update({
      where: { id: ctx.params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ data: deletedNote });
  } catch {
    throw new NotFoundError("Note not found");
  }
});
