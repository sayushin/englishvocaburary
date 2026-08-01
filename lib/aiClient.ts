import OpenAI from "openai";
import type { Provider } from "@/lib/types";

export function isProvider(value: unknown): value is Provider {
  return value === "openai" || value === "deepseek";
}

export function getProviderName(provider: Provider) {
  return provider === "deepseek" ? "DeepSeek" : "OpenAI";
}

export function getApiKey(provider: Provider) {
  return provider === "deepseek"
    ? process.env.DEEPSEEK_API_KEY
    : process.env.OPENAI_API_KEY;
}

export function getClient(provider: Provider) {
  if (provider === "deepseek") {
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getModel(provider: Provider) {
  return provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";
}
