import { twMerge } from "tailwind-merge";

export type ClassValue =
  | string
  | Record<string, boolean>
  | boolean
  | null
  | undefined;

export function cx(...inputs: ClassValue[]): string {
  let result = "";

  for (const input of inputs) {
    if (!input || typeof input === "boolean") continue;

    if (typeof input === "string") {
      result += `${input} `;
      continue;
    }

    for (const [key, value] of Object.entries(input)) {
      if (value) result += `${key} `;
    }
  }

  return result.trimEnd();
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(cx(...inputs));
}
