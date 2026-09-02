import type { Staff, TimeEntry } from "@/lib/db/schema"

/** Converte "HH:MM" em minutos desde meia-noite. Retorna null se inválido. */
export function parseHHMM(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/** Formata minutos totais em "Hh MMmin", com sinal opcional. */
export function formatMinutes(totalMinutes: number, withSign = false): string {
  const sign = totalMinutes < 0 ? "-" : withSign ? "+" : ""
  const abs = Math.abs(Math.round(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}h ${String(m).padStart(2, "0")}min`
}

/** Formata horários sempre no fuso oficial da loja (Brasília). */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "--:--"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Cria um Date com o horário de parede de Brasília, independente do servidor. */
export function nowInBrasilia(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date())
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
}

function diffMinutes(start: Date | null, end: Date | null): number {
  if (!start || !end) return 0
  return (end.getTime() - start.getTime()) / 60000
}

export interface DayCalculation {
  workedMinutes: number // minutos trabalhados (descontando almoço)
  lunchMinutes: number // minutos de almoço
  scheduledMinutes: number // jornada cadastrada (descontando almoço)
  overtimeMinutes: number // saldo positivo (horas extras)
  deficitMinutes: number // saldo negativo (faltou)
  balanceMinutes: number // workedMinutes - scheduledMinutes
  complete: boolean // registro completo (entrada + saída)
}

/**
 * Jornada cadastrada em minutos, descontando o almoço previsto.
 * Ex.: 08:00 -> 18:00 com almoço 12:00-13:00 = 9h.
 */
export function scheduledMinutesForStaff(member: Staff, workDate?: string): number {
  const isSaturday = workDate
    ? new Date(`${workDate}T12:00:00`).getDay() === 6
    : false
  const entry = parseHHMM(isSaturday ? member.saturdayEntryTime : member.entryTime)
  const exit = parseHHMM(isSaturday ? member.saturdayExitTime : member.exitTime)
  if (entry === null || exit === null) return 0
  let total = exit - entry
  const ls = parseHHMM(member.lunchStart)
  const le = parseHHMM(member.lunchEnd)
  if (ls !== null && le !== null && le > ls) {
    total -= le - ls
  }
  return Math.max(0, total)
}

function toDate(value: Date | string | null): Date | null {
  if (!value) return null
  return typeof value === "string" ? new Date(value) : value
}

/**
 * Calcula horas trabalhadas de um registro, descontando o almoço,
 * e compara com a jornada cadastrada do colaborador.
 */
export function calculateDay(entry: TimeEntry, member: Staff): DayCalculation {
  const clockIn = toDate(entry.clockIn)
  const clockOut = toDate(entry.clockOut)
  const lunchStart = toDate(entry.lunchStart)
  const lunchEnd = toDate(entry.lunchEnd)

  const lunchMinutes = Math.max(0, diffMinutes(lunchStart, lunchEnd))
  const grossMinutes = Math.max(0, diffMinutes(clockIn, clockOut))
  const workedMinutes = Math.max(0, grossMinutes - lunchMinutes)

  const scheduledMinutes = scheduledMinutesForStaff(member, entry.workDate)
  const complete = Boolean(clockIn && clockOut)

  const balanceMinutes = complete ? workedMinutes - scheduledMinutes : 0

  return {
    workedMinutes,
    lunchMinutes,
    scheduledMinutes,
    overtimeMinutes: balanceMinutes > 0 ? balanceMinutes : 0,
    deficitMinutes: balanceMinutes < 0 ? -balanceMinutes : 0,
    balanceMinutes,
    complete,
  }
}

/** Agrega vários dias em totais. */
export function aggregateDays(
  entries: TimeEntry[],
  member: Staff,
): {
  totalWorked: number
  totalOvertime: number
  totalDeficit: number
  totalBalance: number
  daysCompleted: number
} {
  let totalWorked = 0
  let totalOvertime = 0
  let totalDeficit = 0
  let daysCompleted = 0

  for (const entry of entries) {
    const calc = calculateDay(entry, member)
    if (!calc.complete) continue
    totalWorked += calc.workedMinutes
    totalOvertime += calc.overtimeMinutes
    totalDeficit += calc.deficitMinutes
    daysCompleted += 1
  }

  return {
    totalWorked,
    totalOvertime,
    totalDeficit,
    totalBalance: totalOvertime - totalDeficit,
    daysCompleted,
  }
}

/** Data de hoje em formato YYYY-MM-DD no fuso de Brasília. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())
}

/** Formata YYYY-MM-DD em "dd/mm/aaaa". */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}
