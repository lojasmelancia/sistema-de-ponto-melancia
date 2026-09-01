import Image from "next/image"

export function MelanciaLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/melancia-logo.png"
        alt="Melancia Foto e Presentes"
        width={64}
        height={64}
        className="size-10 rounded-md object-cover"
        priority
      />
      <span className="font-display text-lg font-semibold tracking-tight">
        Melancia
      </span>
    </span>
  )
}
