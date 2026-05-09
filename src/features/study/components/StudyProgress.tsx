type StudyProgressProps = {
  currentIndex: number;
  totalCards: number;
  answeredCount: number;
  progressPercent: number;
};

export function StudyProgress({
  currentIndex,
  totalCards,
  answeredCount,
  progressPercent,
}: StudyProgressProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-700">Progreso de sesión</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {totalCards === 0 ? "Sin tarjetas" : `Tarjeta ${Math.min(currentIndex + 1, totalCards)} de ${totalCards}`}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Respondidas</p>
          <p className="text-3xl font-semibold text-slate-950">{answeredCount}</p>
        </div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#22c55e)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}
