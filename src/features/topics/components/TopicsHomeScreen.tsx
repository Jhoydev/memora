"use client";

import { BookPlus, LoaderCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateTopicInput, UpdateTopicInput } from "../domain/topic.schema";
import type { StudyTopic } from "../domain/topic.types";
import { useCreateTopicMutation } from "../queries/use-create-topic-mutation";
import { useDeleteTopicMutation } from "../queries/use-delete-topic-mutation";
import { useTopicsQuery } from "../queries/use-topics-query";
import { useUpdateTopicMutation } from "../queries/use-update-topic-mutation";
import { TopicForm } from "./TopicForm";
import { TopicGrid } from "./TopicGrid";

type DialogMode = "create" | "edit";

export function TopicsHomeScreen() {
  const topicsQuery = useTopicsQuery();
  const createTopicMutation = useCreateTopicMutation();
  const updateTopicMutation = useUpdateTopicMutation();
  const deleteTopicMutation = useDeleteTopicMutation();

  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<StudyTopic | null>(null);

  const topics = topicsQuery.data ?? [];

  const mutationErrorMessage = useMemo(() => {
    const mutationError =
      createTopicMutation.error ??
      updateTopicMutation.error ??
      deleteTopicMutation.error ??
      topicsQuery.error;

    if (!mutationError) {
      return null;
    }

    if (mutationError instanceof Error) {
      return mutationError.message;
    }

    return "Ocurrió un error inesperado al gestionar los temas.";
  }, [
    createTopicMutation.error,
    deleteTopicMutation.error,
    topicsQuery.error,
    updateTopicMutation.error,
  ]);

  function openCreateDialog() {
    setDialogMode("create");
    setSelectedTopic(null);
    setIsTopicDialogOpen(true);
  }

  function openEditDialog(topic: StudyTopic) {
    setDialogMode("edit");
    setSelectedTopic(topic);
    setIsTopicDialogOpen(true);
  }

  async function handleSubmitTopic(values: CreateTopicInput | UpdateTopicInput) {
    if (dialogMode === "create") {
      await createTopicMutation.mutateAsync(values as CreateTopicInput);
    } else if (selectedTopic) {
      await updateTopicMutation.mutateAsync({
        topicId: selectedTopic.id,
        input: values as UpdateTopicInput,
      });
    }

    setIsTopicDialogOpen(false);
    setSelectedTopic(null);
  }

  async function handleConfirmDelete() {
    if (!topicToDelete) {
      return;
    }

    await deleteTopicMutation.mutateAsync(topicToDelete.id);
    setTopicToDelete(null);
  }

  const isSaving =
    createTopicMutation.isPending || updateTopicMutation.isPending || deleteTopicMutation.isPending;

  return (
    <main className="memora-page-shell memora-mesh bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.9),_rgba(255,255,255,0.98)_44%,_#fff_78%)]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(120deg,rgba(14,165,233,0.18),rgba(251,191,36,0.10),rgba(236,72,153,0.12))]" />
      <div className="memora-page-content">
        <Reveal delay={0.02}>
          <PageHeader
            eyebrow="Memora · Topics"
            title="Tus temas de estudio, listos para convertirse en memoria visual."
            description="Crea temas claros, dales una identidad visual y prepara la base para añadir tarjetas y estudiar sin perder el foco."
            actions={
              <Button
                type="button"
                onClick={openCreateDialog}
                className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
              >
                <BookPlus className="h-4 w-4" />
                Nuevo tema
              </Button>
            }
          />
        </Reveal>

        {mutationErrorMessage ? (
          <Reveal delay={0.08} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {mutationErrorMessage}
          </Reveal>
        ) : null}

        {topicsQuery.isLoading ? (
          <Reveal
            delay={0.1}
            className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-slate-200/70 bg-white/85 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)] backdrop-blur"
          >
            <div className="flex items-center gap-3 text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Cargando temas de estudio...
            </div>
          </Reveal>
        ) : topics.length === 0 ? (
          <Reveal delay={0.1}>
            <EmptyState
              icon={<Sparkles className="h-7 w-7" />}
              title="Tu biblioteca está vacía por ahora"
              description="Crea tu primer tema para organizar tarjetas y preparar una sesión de estudio enfocada. Aquí comenzará el recorrido completo de Memora."
              action={
                <Button
                  type="button"
                  onClick={openCreateDialog}
                  className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                >
                  Crear primer tema
                </Button>
              }
            />
          </Reveal>
        ) : (
          <Reveal delay={0.1}>
            <TopicGrid topics={topics} onEdit={openEditDialog} onDelete={setTopicToDelete} />
          </Reveal>
        )}
      </div>

      <Dialog
        open={isTopicDialogOpen}
        onOpenChange={(open) => {
          setIsTopicDialogOpen(open);
          if (!open) {
            setSelectedTopic(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-950">
              {dialogMode === "create" ? "Crear tema" : "Editar tema"}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {dialogMode === "create"
                ? "Define la identidad visual del tema para encontrarlo rápido y preparar las siguientes fases del estudio."
                : "Actualiza nombre, color o icono sin tocar la arquitectura de datos ya definida."}
            </DialogDescription>
          </DialogHeader>

          <TopicForm
            defaultValues={selectedTopic ?? undefined}
            submitLabel={dialogMode === "create" ? "Guardar tema" : "Actualizar tema"}
            onSubmit={handleSubmitTopic}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(topicToDelete)}
        title="Eliminar tema"
        description={
          topicToDelete
            ? `Eliminarás "${topicToDelete.name}". Más adelante también se limpiarán sus flashcards asociadas.`
            : ""
        }
        confirmLabel="Sí, eliminar"
        onOpenChange={(open) => {
          if (!open) {
            setTopicToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteTopicMutation.isPending}
      />
    </main>
  );
}
