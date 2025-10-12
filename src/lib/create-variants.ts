import { cx } from "./class-merge";
import type { ClassValue } from "./types";

/**
 * Type utility to extract the props type from a variant selection function.
 *
 * @template T - A function that returns a string.
 */
export type VariantProps<T> = T extends (props: infer P) => string ? P : never;

type TConfig = {
  /**
   * Contains the classes that will always be applied.
   */
  base: ClassValue;

  /**
   * Variant-specific classes. Must include a 'default' which is used as a fallback.
   */
  variant: { default: ClassValue } & Record<string, ClassValue>;

  /**
   * Size-specific classes. Must include a 'default' which is used as a fallback.
   */
  size: { default: ClassValue } & Record<string, ClassValue>;
};

/**
 * Props that can be passed to a variant selection function.
 * These map to the keys of the `variant` and `size` options.
 *
 * @template S - Configuration object defining variant options.
 */
type TSelectionProps<S extends TConfig> = Partial<{
  [K in keyof Omit<TConfig, "base">]: keyof S[K];
}>;

/**
 * Creates a variant selection function that composes class names
 * based on a config object and a set of selected props.
 *
 * @template T - An object containing `base`, `variant`, and `size` mappings.
 * @param config - The configuration object defining base, variant, and size classes.
 * @returns A function that optionally takes `variant` and `size` props and returns a combined class string.
 *
 * @example
 * const button = createVariants({
 *   base: "inline-flex",
 *   variant: { default: "bg-gray-200", primary: "bg-blue-500" },
 *   size: { default: "px-4 py-2", sm: "px-2 py-1" }
 * });
 *
 * button(); // -> "inline-flex bg-gray-200 px-4 py-2"
 * button({ variant: "primary", size: "sm" }); // -> "inline-flex bg-blue-500 px-2 py-1"
 */
export const createVariants =
  <T extends TConfig>(config: T) =>
  (props: TSelectionProps<T>) =>
    cx(
      config.base,
      config.variant[props?.variant ? props.variant : "default"],
      config.size[props?.size ? props.size : "default"],
    );
