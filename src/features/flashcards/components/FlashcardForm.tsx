"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createFlashcardSchema,
  type CreateFlashcardInput,
  type UpdateFlashcardInput,
} from "../domain/flashcard.schema";
import type { Flashcard } from "../domain/flashcard.types";

type FlashcardFormValues = {
  front: string;
  back: string;
};

type FlashcardFormProps = {
  defaultValues?: Partial<Flashcard>;
  submitLabel: string;
  onSubmit: (values: CreateFlashcardInput | UpdateFlashcardInput) => Promise<void> | void;
  isSubmitting?: boolean;
  topicId: string;
};

function buildDefaultValues(defaultValues?: Partial<Flashcard>): FlashcardFormValues {
  return {
    front: defaultValues?.front ?? "",
    back: defaultValues?.back ?? "",
  };
}

export function FlashcardForm({
  defaultValues,
  submitLabel,
  onSubmit,
  isSubmitting = false,
  topicId,
}: FlashcardFormProps) {
  const resolvedDefaults = useMemo(() => buildDefaultValues(defaultValues), [defaultValues]);

  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(createFlashcardSchema.omit({ topicId: true })),
    defaultValues: resolvedDefaults,
  });

  const watchedFront = useWatch({ control: form.control, name: "front" });
  const watchedBack = useWatch({ control: form.control, name: "back" });

  async function handleSubmit(values: FlashcardFormValues) {
    await onSubmit({
      topicId,
      ...values,
    });
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="flashcard-front" className="text-slate-800">
          Frente
        </Label>
        <Input
          id="flashcard-front"
          placeholder="Ej. ¿Qué significa photosynthesis?"
          {...form.register("front")}
          className="border-slate-200 bg-white"
        />
        {form.formState.errors.front ? (
          <p className="text-sm text-rose-600">{form.formState.errors.front.message}</p>
        ) : (
          <p className="text-sm text-slate-500">
            Usa una pregunta o pista breve que puedas reconocer en segundos.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="flashcard-back" className="text-slate-800">
          Reverso
        </Label>
        <Textarea
          id="flashcard-back"
          placeholder="Escribe aquí la respuesta o explicación breve."
          {...form.register("back")}
          className="min-h-32 border-slate-200 bg-white"
        />
        {form.formState.errors.back ? (
          <p className="text-sm text-rose-600">{form.formState.errors.back.message}</p>
        ) : (
          <p className="text-sm text-slate-500">
            La respuesta debe ayudarte a recordar, no convertirse en un párrafo imposible de repasar.
          </p>
        )}
      </div>

      <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <ArrowLeftRight className="h-4 w-4 text-sky-700" />
            Vista previa rápida
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Frente
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-800">
                {watchedFront || "Aquí aparecerá la pista o pregunta principal."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Reverso
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-800">
                {watchedBack || "Aquí verás la respuesta antes de guardar la flashcard."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-slate-950 text-white hover:bg-slate-800"
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
