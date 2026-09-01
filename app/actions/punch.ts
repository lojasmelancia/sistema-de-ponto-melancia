"use server"

import { db } from "@/lib/db"
import { timeEntries } from "@/lib/db/schema"
import { getCurrentStaff } from "@/lib/session"
import { todayISO } from "@/lib/time-utils"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type PunchType = "clockIn" | "lunchStart" | "lunchEnd" | "clockOut"

/**
 * Registra um evento de ponto em tempo real para o colaborador logado.
 * O horário é gravado pelo servidor (não pode ser informado pelo cliente).
 */
export async function punch(type: PunchType) {
  const profile = await getCurrentStaff()
  if (!profile) return { error: "Perfil não encontrado." }
  if (!profile.active) return { error: "Colaborador inativo." }

  const workDate = todayISO()
  const now = new Date()

  // Busca ou cria o registro do dia.
  const existing = await db
    .select()
    .from(timeEntries)
    .where(
      and(eq(timeEntries.userId, profile.userId), eq(timeEntries.workDate, workDate)),
    )
    .limit(1)

  let entry = existing[0]
  if (!entry) {
    const inserted = await db
      .insert(timeEntries)
      .values({ userId: profile.userId, workDate })
      .returning()
    entry = inserted[0]
  }

  // Validação de ordem e de não sobrescrever registros já feitos.
  const guards: Record<PunchType, () => string | null> = {
    clockIn: () => (entry.clockIn ? "Entrada já registrada hoje." : null),
    lunchStart: () => {
      if (!entry.clockIn) return "Registre a entrada primeiro."
      if (entry.lunchStart) return "Saída para o almoço já registrada."
      return null
    },
    lunchEnd: () => {
      if (!entry.lunchStart) return "Registre a saída para o almoço primeiro."
      if (entry.lunchEnd) return "Retorno do almoço já registrado."
      return null
    },
    clockOut: () => {
      if (!entry.clockIn) return "Registre a entrada primeiro."
      if (entry.lunchStart && !entry.lunchEnd)
        return "Registre o retorno do almoço primeiro."
      if (entry.clockOut) return "Saída já registrada hoje."
      return null
    },
  }

  const error = guards[type]()
  if (error) return { error }

  await db
    .update(timeEntries)
    .set({ [type]: now })
    .where(eq(timeEntries.id, entry.id))

  revalidatePath("/painel")
  return { success: true }
}
