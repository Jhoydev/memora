import { BookOpenText, DatabaseZap, Layers3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.95),_rgba(255,255,255,0.98)_42%,_#fff_78%)]">
      <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(14,116,144,0.16),rgba(251,191,36,0.10),rgba(249,115,22,0.12))]" />
      <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-6 py-16 sm:px-10 lg:px-12">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-sm font-medium text-sky-900 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Fase 1 completada: base técnica lista
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Memora arranca con una base preparada para crecer de localStorage a API.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              El proyecto ya está configurado con Next.js, Tailwind CSS, shadcn/ui,
              TanStack Query y la estructura modular definida en el plan técnico.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-slate-950 text-white hover:bg-slate-800">
              Continuar con Fase 2
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-300 bg-white/80 text-slate-800"
            >
              Revisar documentación en docs/
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <Layers3 className="h-8 w-8 text-sky-700" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Arquitectura por capas</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              UI, queries, servicios y repositorios quedan separados desde el primer día.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <DatabaseZap className="h-8 w-8 text-amber-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Persistencia intercambiable</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              La base compartida ya está lista para conectar repositorios locales y, después, API.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <BookOpenText className="h-8 w-8 text-rose-700" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Documentación viva</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Cada fase se registrará en `docs/` con checklist, validaciones y pendientes.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
