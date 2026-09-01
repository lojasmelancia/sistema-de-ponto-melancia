"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { staff, timeEntries } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { parseHHMM } from "@/lib/time-utils"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// ---------------------------------------------------------------------------
// Criar colaborador (cria conta Better Auth + perfil de staff)
// ---------------------------------------------------------------------------
export async function createEmployee(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const entryTime = String(formData.get("entryTime") ?? "").trim() || null
  const lunchStart = String(formData.get("lunchStart") ?? "").trim() || null
  const lunchEnd = String(formData.get("lunchEnd") ?? "").trim() || null
  const exitTime = String(formData.get("exitTime") ?? "").trim() || null

  if (!name || !email || password.length < 8) {
    return { error: "Preencha nome, e-mail e uma senha de ao menos 8 caracteres." }
  }
  for (const [label, v] of [
    ["entrada", entryTime],
    ["início do almoço", lunchStart],
    ["fim do almoço", lunchEnd],
    ["saída", exitTime],
  ] as const) {
    if (v && parseHHMM(v) === null) {
      return { error: `Horário de ${label} inválido. Use o formato HH:MM.` }
    }
  }

  // Cria o usuário via Better Auth (hash de senha gerenciado pela lib).
  let userId: string
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    })
    userId = result.user.id
  } catch (err) {
    console.log("[v0] createEmployee signUp error:", err)
    return { error: "Não foi possível criar a conta. O e-mail já pode estar em uso." }
  }

  await db.insert(staff).values({
    userId,
    name,
    role: "employee",
    entryTime,
    lunchStart,
    lunchEnd,
    exitTime,
  })

  revalidatePath("/admin")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Atualizar jornada / status do colaborador
// ---------------------------------------------------------------------------
export async function updateEmployee(formData: FormData) {
  await requireAdmin()

  const staffId = Number(formData.get("staffId"))
  const name = String(formData.get("name") ?? "").trim()
  const entryTime = String(formData.get("entryTime") ?? "").trim() || null
  const lunchStart = String(formData.get("lunchStart") ?? "").trim() || null
  const lunchEnd = String(formData.get("lunchEnd") ?? "").trim() || null
  const exitTime = String(formData.get("exitTime") ?? "").trim() || null
  const active = formData.get("active") === "on" || formData.get("active") === "true"

  if (!staffId || !name) return { error: "Dados inválidos." }
  for (const v of [entryTime, lunchStart, lunchEnd, exitTime]) {
    if (v && parseHHMM(v) === null) {
      return { error: "Horário inválido. Use o formato HH:MM." }
    }
  }

  await db
    .update(staff)
    .set({ name, entryTime, lunchStart, lunchEnd, exitTime, active })
    .where(eq(staff.id, staffId))

  revalidatePath("/admin")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Editar registro de ponto (SOMENTE admin)
// ---------------------------------------------------------------------------
function combineDateTime(workDate: string, hhmm: string | null): Date | null {
  if (!hhmm) return null
  const minutes = parseHHMM(hhmm)
  if (minutes === null) return null
  const [y, m, d] = workDate.split("-").map(Number)
  const date = new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

export async function updateTimeEntry(formData: FormData) {
  await requireAdmin()

  const employeeUserId = String(formData.get("employeeUserId") ?? "")
  const workDate = String(formData.get("workDate") ?? "")
  const clockIn = String(formData.get("clockIn") ?? "").trim() || null
  const lunchStart = String(formData.get("lunchStart") ?? "").trim() || null
  const lunchEnd = String(formData.get("lunchEnd") ?? "").trim() || null
  const clockOut = String(formData.get("clockOut") ?? "").trim() || null

  if (!employeeUserId || !workDate) return { error: "Dados inválidos." }
  for (const v of [clockIn, lunchStart, lunchEnd, clockOut]) {
    if (v && parseHHMM(v) === null) {
      return { error: "Horário inválido. Use o formato HH:MM." }
    }
  }

  const values = {
    clockIn: combineDateTime(workDate, clockIn),
    lunchStart: combineDateTime(workDate, lunchStart),
    lunchEnd: combineDateTime(workDate, lunchEnd),
    clockOut: combineDateTime(workDate, clockOut),
    editedByAdmin: true,
  }

  const existing = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, employeeUserId),
        eq(timeEntries.workDate, workDate),
      ),
    )
    .limit(1)

  if (existing[0]) {
    await db
      .update(timeEntries)
      .set(values)
      .where(eq(timeEntries.id, existing[0].id))
  } else {
    await db
      .insert(timeEntries)
      .values({ userId: employeeUserId, workDate, ...values })
  }

  revalidatePath("/admin")
  return { success: true }
}
