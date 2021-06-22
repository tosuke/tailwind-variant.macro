import type { NodePath } from "@babel/traverse";
import type * as T from "@babel/types";
import { Context } from "./context";
import { collectVariantsAndParams } from "./collectVariantsAndParams";
import { addVariants } from "./addVariants";

function assertIdentifier(
  nodePath: NodePath
): asserts nodePath is NodePath<T.Identifier> {
  nodePath.assertIdentifier();
}

export function transformReference(
  baseCtx: Omit<Context, "name">,
  ref: NodePath
) {
  if (baseCtx.transformedRef.has(ref)) return;

  assertIdentifier(ref);
  const name = ref.node.name;
  const ctx: Context = { ...baseCtx, name };
  const { t } = ctx;

  const { path, variants, params } = collectVariantsAndParams(ctx, ref);

  const transpiled = addVariants(ctx, variants, params);

  path.replaceWith(t.stringLiteral(transpiled));

  ctx.transformedRef.add(ref);
}
