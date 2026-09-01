import { getCurrentStaff, getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const profile = await getCurrentStaff()

  // Usuário autenticado mas sem perfil de staff (ex.: primeiro admin ainda
  // não configurado) vai para a rota de configuração inicial.
  if (!profile) redirect("/setup")

  if (profile.role === "admin") redirect("/admin")
  redirect("/painel")
}
