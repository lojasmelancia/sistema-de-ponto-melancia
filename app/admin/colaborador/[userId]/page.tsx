import { AddEntryDialog } from "@/components/admin/add-entry-dialog"
import { AdminHistoryTable } from "@/components/admin/admin-history-table"
import { AppHeader } from "@/components/app-header"
import { SummaryCards } from "@/components/summary-cards"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getEntriesForUser, getStaffByUserId } from "@/lib/queries"
import { requireAdmin } from "@/lib/session"
import {
  aggregateDays,
  formatMinutes,
  scheduledMinutesForStaff,
} from "@/lib/time-utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ColaboradorPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const admin = await requireAdmin()
  const { userId } = await params

  const member = await getStaffByUserId(userId)
  if (!member) notFound()

  // Registros do mês corrente.
  const since = new Date()
  since.setDate(1)
  const sinceISO = since.toISOString().slice(0, 10)

  const entries = await getEntriesForUser(member.userId, sinceISO)
  const totals = aggregateDays(entries, member)
  const scheduled = scheduledMinutesForStaff(member)

  return (
    <div className="min-h-screen bg-secondary/30">
      <AppHeader userName={admin.name} roleLabel="Administrador" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            render={<Link href="/admin" />}
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  {member.name}
                </h1>
                {member.active ? (
                  <Badge variant="secondary">Ativo</Badge>
                ) : (
                  <Badge variant="outline">Inativo</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Jornada cadastrada: {member.entryTime ?? "--:--"} às{" "}
                {member.exitTime ?? "--:--"}
                {scheduled > 0 && ` (${formatMinutes(scheduled)}/dia)`}
              </p>
            </div>
            <AddEntryDialog member={member} />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Resumo do mês
          </h2>
          <SummaryCards
            totalWorked={totals.totalWorked}
            totalOvertime={totals.totalOvertime}
            totalDeficit={totals.totalDeficit}
            daysCompleted={totals.daysCompleted}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registros do mês</CardTitle>
            <CardDescription>
              Clique no lápis para corrigir entradas, saídas e horários de
              almoço. Ajustes recalculam automaticamente as horas extras e o
              débito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminHistoryTable entries={entries} member={member} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
