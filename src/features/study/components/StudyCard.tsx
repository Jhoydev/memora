"use client";

import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/features/flashcards/domain/flashcard.types";

type StudyCardProps = {
  flashcard: Flashcard;
  isAnswerVisible: boolean;
  onReveal: () => void;
  onKnown: () => void;
  onUnknown: () => void;
};

export function StudyCard({
  flashcard,
  isAnswerVisible,
  onReveal,
  onKnown,
  onUnknown,
}: StudyCardProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="perspective-1200">
        <motion.article
          layout
          animate={{ rotateY: isAnswerVisible ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="transform-style-preserve-3d relative min-h-[420px]"
        >
          <div className="backface-hidden absolute inset-0 rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.40)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">
                  Frente
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {flashcard.front}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-10 rounded-[1.5rem] bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Reverso
              </p>
              <div className="mt-4 space-y-4">
                <p className="text-base leading-7 text-slate-500">
                  Intenta recuperar la respuesta antes de girar la tarjeta. El objetivo no es leer,
                  sino recordar activamente.
                </p>
                <Button
                  type="button"
                  onClick={onReveal}
                  className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" />
                  Girar tarjeta
                </Button>
              </div>
            </div>
          </div>

          <div className="backface-hidden absolute inset-0 rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.40)] [transform:rotateY(180deg)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-700">
                  Respuesta
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {flashcard.front}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 rounded-[1.5rem] bg-emerald-50 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Reverso
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-800">{flashcard.back}</p>
            </motion.div>
          </div>
        </motion.article>
      </div>

      <aside className="rounded-[2rem] border border-slate-200/80 bg-slate-950 p-8 text-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.50)]">
        <p className="text-sm font-medium text-sky-200">Decisión rápida</p>
        <h3 className="mt-3 text-2xl font-semibold">¿La recordabas con seguridad?</h3>
        <p className="mt-4 text-sm leading-7 text-slate-200">
          Primero intenta recordar, luego revela la respuesta y decide si la dominabas o si
          necesitas reforzarla.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              disabled={!isAnswerVisible}
              onClick={onKnown}
              className="h-12 w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
            >
              La sabía
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              disabled={!isAnswerVisible}
              onClick={onUnknown}
              className="h-12 w-full rounded-full bg-amber-500 text-white hover:bg-amber-600"
            >
              Necesito repasarla
            </Button>
          </motion.div>
        </div>
      </aside>
    </section>
  );
}
