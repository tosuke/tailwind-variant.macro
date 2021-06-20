import type { Variant as TailwindVariant } from "tailwindcss/tailwind-config";

type Screen = "sm" | "md" | "lg" | "xl" | "2xl";

type RawVariant =
  | TailwindVariant
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
  extends Readonly<Record<Screen | Variant, TailwindVariantFn>> {
  (...args: string[]): string;
}

export interface TailwindVariantFn extends TailwindVariantFnBase {}

export const tw: TailwindVariantFn;
