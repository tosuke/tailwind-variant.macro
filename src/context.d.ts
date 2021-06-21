import type * as BabelTypes from "@babel/types";
import type { NodePath } from "@babel/traverse";
import type { TailwindConfig } from "tailwindcss/tailwind-config";

export interface Context {
  // name of identifer(eg. "tw")
  readonly name: string;
  // babel types
  readonly t: typeof BabelTypes;
  // Tailwind Config
  readonly tailwindConfig: TailwindConfig;
  // references to variable
  readonly refs: readonly NodePath[];

  readonly transformedRef: WeakSet<NodePath>;
}
