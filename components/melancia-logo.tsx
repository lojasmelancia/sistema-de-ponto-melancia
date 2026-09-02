import Image from "next/image"

export function MelanciaLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className ?? ""}`}>
      <Image
        src="/melancia-logo.svg"
        alt="Melancia Foto e Presentes"
        width={56}
        height={56}
        className="size-14 rounded-md object-contain"
        priority
      />
    </span>
  )
}
