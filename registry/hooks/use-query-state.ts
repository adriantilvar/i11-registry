import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import type z from "zod";
import type { NonEmptyArray, UniqueArray } from "@/types/array";
import type { Maybe } from "@/types/base";

type UseQueryStateOptions = Partial<{
  /**
   * Fallback value when query parameter is missing, empty, or fails validation.
   *
   * @remarks
   * - used when schema validation fails and `onParseError` is `"fallback"` (default)
   * - without this, empty/invalid values remove the query parameter entirely
   */
  defaultValue: string;
  /**
   * Zod schema for validating query parameter values.
   *
   * @remarks
   * - must return a string to maintain URLSearchParams compatibility.
   *
   * @example
   * ```tsx
   * // Enum validation
   * schema: z.enum(['small', 'medium', 'large'])
   *
   * // Number coercion to string
   * schema: z.coerce.number().min(1).transform(String)
   *
   * // Custom validation
   * schema: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
   * ```
   */
  schema: z.ZodType<string>;
  /**
   * Behavior when schema validation fails (defaults to `"fallback"`).
   *
   * @remarks
   * - `"fallback"` - use `defaultValue` if provided, otherwise remove parameter
   * - `"remove"` - always remove the parameter on validation failure
   */
  onParseError: "fallback" | "remove";
}>;

/**
 * A hook to manage a single URL query parameter.
 *
 * @param key - The name of the query parameter to track
 * @param options - Configuration options with the shape of `UseQueryStateOptions`
 * @returns A tuple containing the current value and a setter function (client-side navigation)
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [page, setPage] = useQueryState('page');
 *
 * // With default value
 * const [sort, setSort] = useQueryState('sort', {
 *   defaultValue: 'name'
 * });
 *
 * // With validation schema
 * const [status, setStatus] = useQueryState('status', {
 *   defaultValue: 'active'
 *   schema: z.enum(['active', 'inactive']),
 * });
 *
 * // Setter usage
 * setStatus('inactive');
 * ```
 *
 * @remarks
 * - implementation is not memoized (assumes React Compiler is used)
 * - `queryState` will be `null` if no query parameter exists and no default is provided
 * - query parameter deduplication (e.g. `step=goal&step=persona`) is out of scope for this
 * hook; it happens to deduplicate query strings sometimes, but it's complete/reliable
 */
export function useQueryString<const K extends string>(
  key: K,
  options?: UseQueryStateOptions,
): [Maybe<string>, (value: string) => void] {
  const isMounted = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryString = searchParams.get(key);

  function setQueryString(value: string) {
    router.replace(
      `${pathname}?${createSearchParams({
        update: [key, value],
        searchParams,
        options,
      })}`,
    );
  }

  useEffect(() => {
    const hasParam = searchParams.has(key);
    const paramValue = searchParams.get(key);

    if (!options || Object.keys(options).length === 0) {
      if (hasParam && !paramValue) {
        setQueryString("");
      }
      return;
    }

    const hasDefaultValue = !!options.defaultValue;
    const hasSchema = !!options.schema;

    if (
      (!isMounted.current &&
        hasDefaultValue &&
        paramValue !== options.defaultValue) ||
      (!isMounted.current && !hasDefaultValue && hasSchema) ||
      (hasParam && !paramValue) ||
      (!hasParam && hasDefaultValue)
    ) {
      if (!isMounted.current) {
        isMounted.current = true;
      }

      setQueryString(paramValue ?? "");
    }
  }, [key, options, searchParams, setQueryString]);

  return [queryString, setQueryString] as const;
}

/**
 *  A hook to manage multiple URL query parameters.
 *
 * @param keys Array of unique query parameter names to track
 * @param options Per-key configuration options, each having the shape of `UseQueryStringOptions`
 * @returns A tuple containing an object of current values and a setter function (client-side navigation)
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [queries, setQuery] = useQueriesState(['sort', 'filter']);
 * // queries: { sort: string | null, filter: string | null }
 *
 * // With per-key options
 * const [queries, setQuery] = useQueriesState(['page', 'sort'], {
 *   page: { defaultValue: '1', schema: z.coerce.number().min(1).transform(String) },
 *   sort: { defaultValue: 'name' }
 * });
 *
 * // Setter usage
 * setQuery('page', '2');
 * ```
 *
 * @remarks
 * - implementation is not memoized (assumes React Compiler is used)
 * - updates are batched when multiple parameters change simultaneously
 * - duplicate keys in the array are not allowed
 * - query parameter deduplication (e.g. `step=goal&step=persona`) is out of scope; it happens to deduplicate * query strings in some instances, but should not be counted on
 */
export function useQueryStrings<const K extends NonEmptyArray<string>>(
  keys: UniqueArray<K>,
  options?: Partial<Record<K[number], UseQueryStateOptions>>,
): [Record<K[number], Maybe<string>>, (key: K[number], value: string) => void] {
  const isMounted = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateSearchParams = (updates: NonEmptyArray<[K[number], string]>) => {
    if (!updates.length) return;

    router.replace(
      `${pathname}?${createSearchParamsWithMany({
        updates,
        searchParams,
        options,
      }).toString()}`,
    );
  };

  function getSearchParamsUpdates(): Array<[K[number], string]> {
    const paramUpdates: Array<[K[number], string]> = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const hasParam = searchParams.has(key);
      const paramValue = searchParams.get(key);
      const paramOptions: Maybe<UseQueryStateOptions> = options?.[key];

      if (!paramOptions || Object.keys(paramOptions).length === 0) {
        if (hasParam && !paramValue) {
          paramUpdates.push([key, ""]);
        }
        continue;
      }

      const hasDefaultValue = !!paramOptions.defaultValue;
      const hasSchema = !!paramOptions.schema;

      if (
        (!isMounted.current &&
          hasDefaultValue &&
          paramValue !== paramOptions.defaultValue) ||
        (!isMounted.current && !hasDefaultValue && hasSchema) ||
        (hasParam && !paramValue) ||
        (!hasParam && hasDefaultValue)
      ) {
        paramUpdates.push([key, paramValue ?? ""]);
      }
    }

    return paramUpdates;
  }

  useEffect(() => {
    const updates = getSearchParamsUpdates();

    if (!isMounted.current) {
      isMounted.current = true;
    }

    if (updates.length > 0) {
      updateSearchParams(updates as NonEmptyArray<[K[number], string]>);
    }
  }, [getSearchParamsUpdates, updateSearchParams]);

  const queryStrings = Object.fromEntries(
    keys.map((key) => [key, searchParams.get(key)]),
  ) as Record<K[number], Maybe<string>>;

  function setQueryString(key: K[number], value: string) {
    updateSearchParams([[key, value]]);
  }

  return [queryStrings, setQueryString] as const;
}

function updateQueryState<Key extends string, Value extends string>({
  key,
  value,
  searchParams,
  options,
}: {
  key: Key;
  value: Value;
  searchParams: URLSearchParams;
  options?: UseQueryStateOptions;
}): void {
  if (!options) {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    return;
  }

  const { defaultValue, schema, onParseError = "fallback" } = options;
  const shouldFallback = onParseError === "fallback" && !!defaultValue;
  const shouldRemove = onParseError === "remove" || !defaultValue;

  if (schema) {
    const validationResult = schema.safeParse(value);

    if (validationResult.success) {
      searchParams.set(key, validationResult.data);
      return;
    }

    if (shouldFallback) {
      searchParams.set(key, defaultValue);
      return;
    }

    if (shouldRemove) {
      searchParams.delete(key);
      return;
    }
  }

  if (!value && shouldFallback) {
    searchParams.set(key, defaultValue);
    return;
  }

  if (!value && shouldRemove) {
    searchParams.delete(key);
    return;
  }

  if (value) {
    searchParams.set(key, value);
  }
}

function createSearchParamsWithMany<Key extends string, Value extends string>({
  updates,
  searchParams,
  options,
}: {
  updates: NonEmptyArray<[Key, Value]>;
  searchParams: URLSearchParams;
  options?: Partial<Record<Key, UseQueryStateOptions>>;
}): URLSearchParams {
  const urlSearchParams = new URLSearchParams(searchParams);

  for (let i = 0; i < updates.length; i++) {
    const [key, value] = updates[i];
    updateQueryState({
      key,
      value,
      searchParams: urlSearchParams,
      options: options?.[key],
    });
  }

  return urlSearchParams;
}

function createSearchParams<Key extends string, Value extends string>({
  update,
  searchParams,
  options,
}: {
  update: [Key, Value];
  searchParams: URLSearchParams;
  options?: UseQueryStateOptions;
}): URLSearchParams {
  const urlSearchParams = new URLSearchParams(searchParams);
  const [key, value] = update;
  updateQueryState({
    key,
    value,
    searchParams: urlSearchParams,
    options,
  });

  return urlSearchParams;
}
