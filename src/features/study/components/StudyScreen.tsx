"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, LoaderCircle, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { useFlashcardsByTopicQuery } from "@/features/flashcards/queries/use-flashcards-by-topic-query";
import { getTopicColorMeta, topicIconMap, type TopicIconId } from "@/features/topics/components/topic-ui.constants";
import { useTopicQuery } from "@/features/topics/queries/use-topic-query";
import { cn } from "@/lib/utils";
import { useStudySession } from "../hooks/use-study-session";
import { StudyCard } from "./StudyCard";
import { StudyProgress } from "./StudyProgress";
import { StudySummary } from "./StudySummary";

type StudyScreenProps = {
  topicId: string;
};

export function StudyScreen({ topicId }: StudyScreenProps) {
  const topicQuery = useTopicQuery(topicId);
  const flashcardsQuery = useFlashcardsByTopicQuery(topicId);

  const topic = topicQuery.data;
  const flashcards = flashcardsQuery.data ?? [];

  const session = useStudySession({
    topicId,
    flashcards,
  });

  if (topicQuery.isLoading || flashcardsQuery.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.94),_rgba(255,255,255,0.98)_48%,_#fff_84%)] px-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-6 py-4 text-slate-600 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)]">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Preparando tu sesión de estudio...
        </div>
      </main>
    );
  }

  if (!topic) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.94),_rgba(255,255,255,0.98)_48%,_#fff_84%)] px-6 py-10">
        <div className="w-full max-w-3xl">
          <EmptyState
            icon={<BookOpen className="h-7 w-7" />}
            title="No encontramos el tema para estudiar"
            description="Puede que haya sido eliminado o que el identificador ya no sea válido. Vuelve a la biblioteca para elegir otro tema."
            action={
              <Link
                href="/"
                className={cn(
                  buttonVariants(),
                  "rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800",
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a temas
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  if (flashcards.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.94),_rgba(255,255,255,0.98)_48%,_#fff_84%)] px-6 py-10">
        <div className="w-full max-w-3xl">
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="Todavía no hay tarjetas para estudiar"
            description="Antes de iniciar una sesión necesitas al menos una flashcard en este tema. Vuelve al detalle y crea la primera."
            action={
              <Link
                href={`/topics/${topicId}`}
                className={cn(
                  buttonVariants(),
                  "rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800",
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al tema
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const TopicIcon = topic.icon ? topicIconMap[topic.icon as TopicIconId] : topicIconMap.brain;
  const colorMeta = getTopicColorMeta(topic.color);

  return (
    <main className="memora-page-shell memora-mesh bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.94),_rgba(255,255,255,0.98)_48%,_#fff_84%)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(120deg,rgba(14,165,233,0.18),rgba(34,197,94,0.10),rgba(249,115,22,0.12))]" />
      <div className="memora-page-content">
        <div className="flex items-center">
          <Link
            href={`/topics/${topicId}`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "rounded-full px-0 text-slate-600 hover:bg-transparent hover:text-slate-950",
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al tema
          </Link>
        </div>

        <Reveal delay={0.02}>
          <PageHeader
            eyebrow="Memora · Study"
            title={`Sesión: ${topic.name}`}
            description="Repasa una tarjeta por vez, revela la respuesta solo después de intentarlo y marca rápidamente si ya la dominabas o si necesita otro repaso."
            actions={
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${topic.color}22`, color: topic.color }}
                >
                  <TopicIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{topic.name}</p>
                  <p className="text-xs text-slate-500">{colorMeta.label}</p>
                </div>
              </div>
            }
          />
        </Reveal>

        {session.isCompleted ? (
          <Reveal delay={0.08}>
            <StudySummary
              result={session.result}
              topicId={topicId}
              onRestart={session.restartSession}
            />
          </Reveal>
        ) : (
          <>
            <Reveal delay={0.08}>
              <StudyProgress
                currentIndex={session.currentIndex}
                totalCards={session.totalCards}
                answeredCount={session.answeredCount}
                progressPercent={session.progressPercent}
              />
            </Reveal>

            {session.currentFlashcard ? (
              <Reveal delay={0.12}>
                <StudyCard
                  flashcard={session.currentFlashcard}
                  isAnswerVisible={session.isAnswerVisible}
                  onReveal={session.revealAnswer}
                  onKnown={() => session.answerCurrentCard("known")}
                  onUnknown={() => session.answerCurrentCard("unknown")}
                />
              </Reveal>
            ) : null}

            <Reveal delay={0.16}>
              <section className="rounded-[2rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sky-200">Consejo rápido</p>
                    <h3 className="text-xl font-semibold">Intenta recordar antes de revelar</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-200">
                  La sesión está pensada para obligarte a recuperar la respuesta mentalmente antes
                  de verla. Esa fricción ligera mejora el aprendizaje y deja el resumen final mucho
                  más útil.
                </p>
              </section>
            </Reveal>
          </>
        )}
      </div>
    </main>
  );
}
