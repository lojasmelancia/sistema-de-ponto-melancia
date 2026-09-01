"use client"

import type React from "react"

import { updateTimeEntry } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TimeEntry } from "@/lib/db/schema"
import { formatDateBR } from "@/lib/time-utils"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

function toTimeValue(value: Date | string | null): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export function EditEntryDialog({
  employeeUserId,
  workDate,
  entry,
  open,
  onOpenChange,
}: {
  employeeUserId: string
  workDate: string
  entry: TimeEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set("employeeUserId", employeeUserId)
    form.set("workDate", workDate)
    startTransition(async () => {
      const result = await updateTimeEntry(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Registro atualizado.")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar registro</DialogTitle>
            <DialogDescription>{formatDateBR(workDate)}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="clockIn" className="text-xs">
                Entrada
              </Label>
              <Input
                id="clockIn"
                name="clockIn"
                type="time"
                defaultValue={toTimeValue(entry?.clockIn ?? null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="clockOut" className="text-xs">
                Saída
              </Label>
              <Input
                id="clockOut"
                name="clockOut"
                type="time"
                defaultValue={toTimeValue(entry?.clockOut ?? null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lunchStart" className="text-xs">
                Início almoço
              </Label>
              <Input
                id="lunchStart"
                name="lunchStart"
                type="time"
                defaultValue={toTimeValue(entry?.lunchStart ?? null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lunchEnd" className="text-xs">
                Fim almoço
              </Label>
              <Input
                id="lunchEnd"
                name="lunchEnd"
                type="time"
                defaultValue={toTimeValue(entry?.lunchEnd ?? null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
