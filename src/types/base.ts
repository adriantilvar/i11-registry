export type ClassValue =
  | string
  | Record<string, boolean>
  | boolean
  | null
  | undefined;

export type Maybe<T> = NoInfer<T | undefined | null>;
