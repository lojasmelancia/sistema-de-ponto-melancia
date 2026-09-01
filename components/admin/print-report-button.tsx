"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintReportButton() {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print-hidden">
      <Printer data-icon="inline-start" />
      Imprimir relatório A4
    </Button>
  )
}
