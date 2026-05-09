import Link from "next/link";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudyTopic } from "../domain/topic.types";
import { getTopicColorMeta, topicIconMap, type TopicIconId } from "./topic-ui.constants";

type TopicCardProps = {
  topic: StudyTopic;
  onEdit: (topic: StudyTopic) => void;
  onDelete: (topic: StudyTopic) => void;
};

export function TopicCard({ topic, onEdit, onDelete }: TopicCardProps) {
  const colorMeta = getTopicColorMeta(topic.color);
  const TopicIcon = topic.icon ? topicIconMap[topic.icon as TopicIconId] : topicIconMap.brain;

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-[0_26px_80px_-44px_rgba(15,23,42,0.40)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_90px_-40px_rgba(15,23,42,0.48)]">
      <CardHeader className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[1.25rem]"
            style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
          >
            <TopicIcon className="h-7 w-7" />
          </div>
          <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
            {colorMeta.label}
          </Badge>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{topic.name}</h2>
          <p className="text-sm leading-6 text-slate-600">
            Tema listo para organizar tarjetas, repasos visuales y sesiones de estudio.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Creado el{" "}
            {new Date(topic.createdAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-3 p-6 pt-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(topic)}
          className="border-slate-300 text-slate-800"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onDelete(topic)}
          className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
        <Link
          href={`/topics/${topic.id}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "ml-auto rounded-full border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200",
          )}
        >
          Abrir tema
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
