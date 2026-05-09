"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createTopicSchema,
  type CreateTopicInput,
  type UpdateTopicInput,
} from "../domain/topic.schema";
import type { StudyTopic } from "../domain/topic.types";
import {
  topicColorOptions,
  topicIconMap,
  topicIconOptions,
  type TopicIconId,
} from "./topic-ui.constants";

type TopicFormValues = CreateTopicInput;

type TopicFormProps = {
  defaultValues?: Partial<StudyTopic>;
  submitLabel: string;
  onSubmit: (values: CreateTopicInput | UpdateTopicInput) => Promise<void> | void;
  isSubmitting?: boolean;
};

function buildDefaultValues(defaultValues?: Partial<StudyTopic>): TopicFormValues {
  return {
    name: defaultValues?.name ?? "",
    color: defaultValues?.color ?? topicColorOptions[0].value,
    icon: defaultValues?.icon ?? "brain",
  };
}

export function TopicForm({
  defaultValues,
  submitLabel,
  onSubmit,
  isSubmitting = false,
}: TopicFormProps) {
  const resolvedDefaults = useMemo(() => buildDefaultValues(defaultValues), [defaultValues]);

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: resolvedDefaults,
  });

  const selectedIcon = useWatch({
    control: form.control,
    name: "icon",
  }) as TopicIconId | undefined;
  const selectedColor = useWatch({
    control: form.control,
    name: "color",
  });
  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });

  async function handleSubmit(values: TopicFormValues) {
    await onSubmit(values);
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="topic-name" className="text-slate-800">
          Nombre del tema
        </Label>
        <Input
          id="topic-name"
          placeholder="Ej. Biología molecular"
          {...form.register("name")}
          className="border-slate-200 bg-white"
        />
        {form.formState.errors.name ? (
          <p className="text-sm text-rose-600">{form.formState.errors.name.message}</p>
        ) : (
          <p className="text-sm text-slate-500">
            El nombre debe ayudarte a reconocer rápidamente qué vas a estudiar.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-slate-800">Color</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {topicColorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => form.setValue("color", option.value, { shouldValidate: true })}
              className={cn(
                "rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                selectedColor === option.value
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700",
              )}
            >
              <span className="flex items-center gap-3">
                <span className={cn("h-4 w-4 rounded-full", option.chipClassName)} />
                <span className="text-sm font-medium">{option.label}</span>
              </span>
            </button>
          ))}
        </div>
        {form.formState.errors.color ? (
          <p className="text-sm text-rose-600">{form.formState.errors.color.message}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <Label className="text-slate-800">Icono</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {topicIconOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedIcon === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => form.setValue("icon", option.value, { shouldValidate: true })}
                className={cn(
                  "rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                  isSelected
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </span>
                  {isSelected ? <Check className="h-4 w-4" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
        <CardContent className="flex items-start gap-3 p-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${selectedColor}22`, color: selectedColor }}
          >
            {selectedIcon ? (
              (() => {
                const PreviewIcon = topicIconMap[selectedIcon];
                return <PreviewIcon className="h-6 w-6" />;
              })()
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">Vista previa del tema</p>
            <p className="text-sm text-slate-600">
              {watchedName || "Tu nuevo tema aparecerá aquí con este estilo visual."}
            </p>
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
