"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CreditCard,
  LoaderCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTopicQuery } from "@/features/topics/queries/use-topic-query";
import { getTopicColorMeta, topicIconMap, type TopicIconId } from "@/features/topics/components/topic-ui.constants";
import { cn } from "@/lib/utils";
import type { CreateFlashcardInput, UpdateFlashcardInput } from "../domain/flashcard.schema";
import type { Flashcard } from "../domain/flashcard.types";
import { useCreateFlashcardMutation } from "../queries/use-create-flashcard-mutation";
import { useDeleteFlashcardMutation } from "../queries/use-delete-flashcard-mutation";
import { useFlashcardsByTopicQuery } from "../queries/use-flashcards-by-topic-query";
import { useUpdateFlashcardMutation } from "../queries/use-update-flashcard-mutation";
import { FlashcardForm } from "./FlashcardForm";
import { FlashcardGrid } from "./FlashcardGrid";

type FlashcardDialogMode = "create" | "edit";

type TopicDetailScreenProps = {
  topicId: string;
};

export function TopicDetailScreen({ topicId }: TopicDetailScreenProps) {
  const topicQuery = useTopicQuery(topicId);
  const flashcardsQuery = useFlashcardsByTopicQuery(topicId);
  const createFlashcardMutation = useCreateFlashcardMutation();
  const updateFlashcardMutation = useUpdateFlashcardMutation();
  const deleteFlashcardMutation = useDeleteFlashcardMutation();

  const [isFlashcardDialogOpen, setIsFlashcardDialogOpen] = useState(false);
  const [flashcardDialogMode, setFlashcardDialogMode] = useState<FlashcardDialogMode>("create");
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
  const [flashcardToDelete, setFlashcardToDelete] = useState<Flashcard | null>(null);

  const topic = topicQuery.data;
  const flashcards = flashcardsQuery.data ?? [];

  const errorMessage = useMemo(() => {
    const error =
      topicQuery.error ??
      flashcardsQuery.error ??
      createFlashcardMutation.error ??
      updateFlashcardMutation.error ??
      deleteFlashcardMutation.error;

    if (!error) {
      return null;
    }

    return error instanceof Error
      ? error.message
      : "Ocurrió un error inesperado al gestionar las flashcards.";
  }, [
    createFlashcardMutation.error,
    deleteFlashcardMutation.error,
    flashcardsQuery.error,
    topicQuery.error,
    updateFlashcardMutation.error,
  ]);

  function openCreateDialog() {
    setFlashcardDialogMode("create");
    setSelectedFlashcard(null);
    setIsFlashcardDialogOpen(true);
  }

  function openEditDialog(flashcard: Flashcard) {
    setFlashcardDialogMode("edit");
    setSelectedFlashcard(flashcard);
    setIsFlashcardDialogOpen(true);
  }

  async function handleSubmitFlashcard(values: CreateFlashcardInput | UpdateFlashcardInput) {
    if (flashcardDialogMode === "create") {
      await createFlashcardMutation.mutateAsync(values as CreateFlashcardInput);
    } else if (selectedFlashcard) {
      await updateFlashcardMutation.mutateAsync({
        flashcardId: selectedFlashcard.id,
        topicId,
        input: values as UpdateFlashcardInput,
      });
    }

    setIsFlashcardDialogOpen(false);
    setSelectedFlashcard(null);
  }

  async function handleConfirmDelete() {
    if (!flashcardToDelete) {
      return;
    }

    await deleteFlashcardMutation.mutateAsync({
      flashcardId: flashcardToDelete.id,
      topicId,
    });
    setFlashcardToDelete(null);
  }

  if (topicQuery.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.92),_rgba(255,255,255,0.98)_50%,_#fff_80%)] px-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-6 py-4 text-slate-600 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)]">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Cargando tema y colección de tarjetas...
        </div>
      </main>
    );
  }

  if (!topic) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.92),_rgba(255,255,255,0.98)_50%,_#fff_80%)] px-6 py-10">
        <div className="w-full max-w-3xl">
          <EmptyState
            icon={<BookOpen className="h-7 w-7" />}
            title="No encontramos este tema"
            description="Puede que haya sido eliminado o que el identificador ya no sea válido. Vuelve a la biblioteca para elegir otro tema de estudio."
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

  const TopicIcon = topic.icon ? topicIconMap[topic.icon as TopicIconId] : topicIconMap.brain;
  const colorMeta = getTopicColorMeta(topic.color);
  const isSaving =
    createFlashcardMutation.isPending ||
    updateFlashcardMutation.isPending ||
    deleteFlashcardMutation.isPending;

  return (
    <main className="memora-page-shell memora-mesh bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.92),_rgba(255,255,255,0.98)_46%,_#fff_82%)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(120deg,rgba(14,165,233,0.18),rgba(59,130,246,0.08),rgba(249,115,22,0.14))]" />
      <div className="memora-page-content">
        <div className="flex items-center">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "rounded-full px-0 text-slate-600 hover:bg-transparent hover:text-slate-950",
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a temas
          </Link>
        </div>

        <Reveal delay={0.02}>
          <PageHeader
            eyebrow="Memora · Detalle del tema"
            title={topic.name}
            description="Añade tarjetas mnemotécnicas, mantén la colección enfocada y prepara el terreno para una sesión de estudio sin ruido."
            actions={
              <>
                {flashcards.length > 0 ? (
                  <Link
                    href={`/topics/${topicId}/study`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-12 rounded-full border-slate-300 bg-white/80 text-slate-700 hover:bg-white",
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    Empezar estudio
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="h-12 rounded-full border-slate-300 bg-white/80 text-slate-500"
                    title="Necesitas al menos una flashcard"
                  >
                    <Sparkles className="h-4 w-4" />
                    Crea una tarjeta para estudiar
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={openCreateDialog}
                  className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Nueva flashcard
                </Button>
              </>
            }
          />
        </Reveal>

        <Reveal delay={0.08} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="memora-surface p-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-[1.4rem]"
                style={{ backgroundColor: `${topic.color}22`, color: topic.color }}
              >
                <TopicIcon className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-sky-700">{colorMeta.label}</p>
                <h2 className="text-2xl font-semibold text-slate-950">Colección del tema</h2>
                <p className="max-w-xl text-sm leading-7 text-slate-600">
                  Este espacio reúne solo las tarjetas de <strong>{topic.name}</strong>, para que
                  el estudio se mantenga ordenado por contexto y objetivo.
                </p>
              </div>
            </div>
            <Separator className="my-6 bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Tarjetas
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{flashcards.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Listo para estudio
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {flashcards.length > 0
                    ? "La colección ya puede abrirse en modo estudio."
                    : "Añade al menos una tarjeta para activar el modo estudio."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  CTA siguiente
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Crea o ajusta tarjetas antes de iniciar repaso.
                </p>
              </div>
            </div>
          </div>

          <div className="memora-dark-surface p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-sky-200">Siguiente transición</p>
                <h3 className="text-xl font-semibold">Del CRUD al repaso</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-200">
              Este detalle prepara el contexto para estudiar después. La CTA de estudio ya aparece
              aquí para que la navegación final de la siguiente fase nazca en el lugar correcto.
            </p>
          </div>
        </Reveal>

        {errorMessage ? (
          <Reveal delay={0.1} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </Reveal>
        ) : null}

        {flashcardsQuery.isLoading ? (
          <Reveal className="flex min-h-[260px] items-center justify-center rounded-[2rem] border border-slate-200/70 bg-white/85 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3 text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Cargando flashcards del tema...
            </div>
          </Reveal>
        ) : flashcards.length === 0 ? (
          <Reveal delay={0.12}>
            <EmptyState
              icon={<CreditCard className="h-7 w-7" />}
              title="Aún no hay flashcards en este tema"
              description="Empieza creando la primera tarjeta. Este detalle ya está listo para organizar la colección y dejarla preparada para estudiar."
              action={
                <Button
                  type="button"
                  onClick={openCreateDialog}
                  className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                >
                  Crear primera flashcard
                </Button>
              }
            />
          </Reveal>
        ) : (
          <Reveal delay={0.12}>
            <FlashcardGrid
              flashcards={flashcards}
              onEdit={openEditDialog}
              onDelete={setFlashcardToDelete}
            />
          </Reveal>
        )}
      </div>

      <Dialog
        open={isFlashcardDialogOpen}
        onOpenChange={(open) => {
          setIsFlashcardDialogOpen(open);
          if (!open) {
            setSelectedFlashcard(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-950">
              {flashcardDialogMode === "create" ? "Crear flashcard" : "Editar flashcard"}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {flashcardDialogMode === "create"
                ? "Añade una tarjeta clara y breve para mantener el estudio ligero y enfocado."
                : "Actualiza frente o reverso sin salir del contexto del tema actual."}
            </DialogDescription>
          </DialogHeader>

          <FlashcardForm
            defaultValues={selectedFlashcard ?? undefined}
            submitLabel={flashcardDialogMode === "create" ? "Guardar flashcard" : "Actualizar flashcard"}
            onSubmit={handleSubmitFlashcard}
            isSubmitting={isSaving}
            topicId={topicId}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(flashcardToDelete)}
        title="Eliminar flashcard"
        description={
          flashcardToDelete
            ? `Eliminarás la tarjeta "${flashcardToDelete.front}". Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Sí, eliminar"
        onOpenChange={(open) => {
          if (!open) {
            setFlashcardToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteFlashcardMutation.isPending}
      />
    </main>
  );
}
