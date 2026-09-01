"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        await signOut()
        router.push("/sign-in")
        router.refresh()
      }}
    >
      <LogOut className="size-4" />
      Sair
    </Button>
  )
}
