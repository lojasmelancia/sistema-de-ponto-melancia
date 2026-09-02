"use client"

import type React from "react"

import { updateEmployee } from "@/app/actions/admin"
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
import type { Staff } from "@/lib/db/schema"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

export function EditEmployeeDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Staff
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [active, setActive] = useState(member.active)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set("staffId", String(member.id))
    form.set("active", active ? "true" : "false")
    startTransition(async () => {
      const result = await updateEmployee(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Colaborador atualizado.")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar jornada</DialogTitle>
            <DialogDescription>{member.name}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={member.name} required />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="grid gap-1.5">
                <Label htmlFor="entryTime" className="text-xs">
                  Entrada
                </Label>
                <Input
                  id="entryTime"
                  name="entryTime"
                  type="time"
                  defaultValue={member.entryTime ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="exitTime" className="text-xs">
                  Saída
                </Label>
                <Input
                  id="exitTime"
                  name="exitTime"
                  type="time"
                  defaultValue={member.exitTime ?? ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lunchStart" className="text-xs">
                  Início do almoço
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
                  Fim do almoço
                </Label>
                <Input
                  id="lunchEnd"
                  name="lunchEnd"
                  type="time"
                  defaultValue={member.lunchEnd ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
              <p className="col-span-2 text-xs font-medium text-muted-foreground">Jornada de sábado</p>
              <div className="grid gap-1.5"><Label htmlFor="saturdayEntryTime" className="text-xs">Entrada</Label><Input id="saturdayEntryTime" name="saturdayEntryTime" type="time" defaultValue={member.saturdayEntryTime ?? ""} /></div>
              <div className="grid gap-1.5"><Label htmlFor="saturdayExitTime" className="text-xs">Saída</Label><Input id="saturdayExitTime" name="saturdayExitTime" type="time" defaultValue={member.saturdayExitTime ?? ""} /></div>
              <div className="grid gap-1.5"><Label htmlFor="saturdayLunchStart" className="text-xs">Início do almoço</Label><Input id="saturdayLunchStart" name="saturdayLunchStart" type="time" defaultValue={member.saturdayLunchStart ?? ""} /></div>
              <div className="grid gap-1.5"><Label htmlFor="saturdayLunchEnd" className="text-xs">Fim do almoço</Label><Input id="saturdayLunchEnd" name="saturdayLunchEnd" type="time" defaultValue={member.saturdayLunchEnd ?? ""} /></div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Colaborador ativo (pode bater ponto)
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
