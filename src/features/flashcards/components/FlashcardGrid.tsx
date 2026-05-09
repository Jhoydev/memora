import type { Flashcard } from "../domain/flashcard.types";
import { FlashcardPreview } from "./FlashcardPreview";

type FlashcardGridProps = {
  flashcards: Flashcard[];
  onEdit: (flashcard: Flashcard) => void;
  onDelete: (flashcard: Flashcard) => void;
};

export function FlashcardGrid({ flashcards, onEdit, onDelete }: FlashcardGridProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {flashcards.map((flashcard) => (
        <FlashcardPreview
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
