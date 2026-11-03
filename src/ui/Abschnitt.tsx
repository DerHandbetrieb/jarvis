// Kasten mit Überschrift (wie „Abschnitt“ in der Werkstatt-App, src/components/Formular.tsx)
import type { ReactNode } from 'react'

export function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 font-semibold text-neutral-700">{titel}</h2>
      {children}
    </section>
  )
}
