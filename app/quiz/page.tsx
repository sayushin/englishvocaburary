import FlashcardQuiz from "@/components/FlashcardQuiz";

export default function QuizPage() {
  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-8">
      <h1 className="mb-2 text-2xl font-bold">Quiz</h1>
      <p className="mb-6 text-sm text-gray-500">
        Review 10 random words with flashcards.
      </p>

      <FlashcardQuiz />
    </main>
  );
}
