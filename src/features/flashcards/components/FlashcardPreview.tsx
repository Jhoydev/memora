import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Flashcard } from "../domain/flashcard.types";

type FlashcardPreviewProps = {
  flashcard: Flashcard;
  onEdit: (flashcard: Flashcard) => void;
  onDelete: (flashcard: Flashcard) => void;
};

export function FlashcardPreview({
  flashcard,
  onEdit,
  onDelete,
}: FlashcardPreviewProps) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-slate-200/80 bg-white/90 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)]">
      <CardHeader className="space-y-2 bg-[linear-gradient(160deg,rgba(14,165,233,0.06),rgba(255,255,255,0.92))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Frente</p>
        <h3 className="text-lg font-semibold leading-7 text-slate-950">{flashcard.front}</h3>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Reverso
        </p>
        <p className="line-clamp-5 text-sm leading-7 text-slate-700">{flashcard.back}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 p-5 pt-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(flashcard)}
          className="border-slate-300 text-slate-800"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onDelete(flashcard)}
          className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
