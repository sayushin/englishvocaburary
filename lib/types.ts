export type Provider = "openai" | "deepseek";

export type ExpressionKind = "short_expression" | "sentence" | "paragraph";

export type ExpressionSuggestion = {
  kind: ExpressionKind;
  englishSentence: string;
  japaneseMeaning: string;
};

export type SavedExpression = {
  id: string;
  englishSentence: string;
  japaneseMeaning: string;
  createdAt: string;
  updatedAt: string;
};

export type QuizMode = "vocabulary" | "expression" | "mixed";

export type TypedQuizItem = {
  id: string;
  source: "vocabulary" | "expression";
  sourceId: string | number;
  question: string;
  answer: string;
  questionLabel: "English" | "Japanese";
  answerLabel: "English" | "Japanese";
  vocabularyWord?: string;
};
