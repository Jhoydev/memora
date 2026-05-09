import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudySessionResult } from "../domain/study.types";

type StudySummaryProps = {
  result: StudySessionResult;
  topicId: string;
  onRestart: () => void;
};

export function StudySummary({ result, topicId, onRestart }: StudySummaryProps) {
  const successRate =
    result.totalCards === 0 ? 0 : Math.round((result.knownCards / result.totalCards) * 100);

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <article className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.40)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">
          Resumen final
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Terminaste la sesión
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Ya sabes qué tarjetas dominas y cuáles necesitan otra vuelta. Usa este cierre como una
          guía rápida, no como una nota definitiva.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Total
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{result.totalCards}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Sabidas
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-800">{result.knownCards}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              A repasar
            </p>
            <p className="mt-3 text-3xl font-semibold text-amber-800">{result.unknownCards}</p>
          </div>
        </div>
      </article>

      <aside className="rounded-[2rem] border border-slate-200/80 bg-slate-950 p-8 text-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.50)]">
        <p className="text-sm font-medium text-sky-200">Lectura rápida</p>
        <h3 className="mt-3 text-2xl font-semibold">Retención estimada: {successRate}%</h3>
        <p className="mt-4 text-sm leading-7 text-slate-200">
          Si el porcentaje es bajo, vuelve al detalle del tema y añade pistas más claras o tarjetas
          más pequeñas. Si es alto, ya tienes una base bastante sólida.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onRestart}
            className={cn(
              buttonVariants(),
              "h-12 rounded-full bg-white text-slate-950 hover:bg-slate-100",
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Repetir sesión
          </button>
          <Link
            href={`/topics/${topicId}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al tema
          </Link>
        </div>
      </aside>
    </section>
  );
}
