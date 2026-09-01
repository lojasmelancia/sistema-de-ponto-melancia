import "server-only"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { staff } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function getCurrentUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/** Retorna o perfil de staff do usuário logado (ou null). */
export async function getCurrentStaff() {
  const session = await getSession()
  if (!session?.user) return null
  const rows = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, session.user.id))
    .limit(1)
  return rows[0] ?? null
}

/** Garante que o usuário logado é admin, senão lança erro. */
export async function requireAdmin() {
  const profile = await getCurrentStaff()
  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden")
  }
  return profile
}
