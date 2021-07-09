import type { Variant as TailwindVariant } from "tailwindcss/tailwind-config";

type Screen = "sm" | "md" | "lg" | "xl" | "2xl";

type Camel<S extends string> = S extends `${infer S1}-${infer S2}`
  ? `${Camel<S1>}${Capitalize<Camel<S2>>}`
  : S;

type RawVariant =
  | TailwindVariant
  | "motion-safe"
  | "motion-reduce"
  | "before"
  | "after"
  | "first-letter"
  | "first-line"
  | "selection"
  | "marker"
  | "only"
  | "first-of-type"
  | "last-of-type"
  | "target"
  | "default"
  | "indeterminate"
  | "placeholder-shown"
  | "autofill"
  | "required"
  | "valid"
  | "invalid"
  | "in-range"
  | "out-of-range";

type Variant = RawVariant | `peer-${RawVariant}`;

interface TailwindVariantFnBase
  extends Readonly<
    Record<Screen | Variant | Camel<Variant>, TailwindVariantFn>
  > {
  (...args: string[]): string;
  (template: TemplateStringsArray, ...params: string[]): string;
}

export interface TailwindVariantFn extends TailwindVariantFnBase {}

export const tw: TailwindVariantFn;
