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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Staff } from "@/lib/db/schema"
import { todayISO } from "@/lib/time-utils"
import { CalendarPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

/**
 * Permite ao admin lançar um registro em qualquer data (inclusive dias sem
 * batida). Reaproveita a mesma action updateTimeEntry, que insere ou atualiza
 * o registro do par colaborador + data.
 */
export function AddEntryDialog({ member }: { member: Staff }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set("employeeUserId", member.userId)
    startTransition(async () => {
      const result = await updateTimeEntry(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Registro lançado.")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <CalendarPlus className="size-4" />
        Lançar registro
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Lançar registro</DialogTitle>
            <DialogDescription>
              Registro manual de ponto para {member.name}. Preencha a data e os
              horários.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="workDate" className="text-xs">
                Data
              </Label>
              <Input
                id="workDate"
                name="workDate"
                type="date"
                required
                defaultValue={todayISO()}
                max={todayISO()}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="clockIn" className="text-xs">
                  Entrada
                </Label>
                <Input
                  id="clockIn"
                  name="clockIn"
                  type="time"
                  defaultValue={member.entryTime ?? ""}
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
                  defaultValue={member.exitTime ?? ""}
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
                  defaultValue={member.lunchStart ?? ""}
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
                  defaultValue={member.lunchEnd ?? ""}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Lançando..." : "Lançar registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
