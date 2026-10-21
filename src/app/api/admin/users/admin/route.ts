import { withAdminSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";

export const PATCH = withAdminSession(async (request, _context, session) => {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("userId" in body) || !("admin" in body)
    || typeof body.userId !== "string" || typeof body.admin !== "boolean") {
    return Response.json({ error: "Provide a user ID and admin status." }, { status: 400 });
  }

  const { userId, admin: nextAdmin } = body as { userId: string; admin: boolean };
  const db = getPrisma();
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, steamId: true, admin: true } });
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });
  if (target.admin === nextAdmin) return Response.json({ id: target.id, admin: target.admin });
  if (!nextAdmin && target.steamId === session.steamId) {
    return Response.json({ error: "You cannot remove your own admin access." }, { status: 409 });
  }

  const updated = await db.$transaction(async (tx) => {
    if (!nextAdmin && await tx.user.count({ where: { admin: true } }) <= 1) return null;
    return tx.user.update({ where: { id: target.id }, data: { admin: nextAdmin }, select: { id: true, admin: true } });
  }, { isolationLevel: "Serializable" });

  if (!updated) return Response.json({ error: "The last administrator cannot be removed." }, { status: 409 });
  return Response.json(updated, { headers: { "Cache-Control": "private, no-store" } });
});