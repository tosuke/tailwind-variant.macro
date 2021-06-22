import type { NodePath } from "@babel/traverse";
import type * as T from "@babel/types";
import { Context } from "./context";
import { createError } from "./createError";
import { getStringValueFromPath } from "./getStringValueFromPath";

function collectParamsFromCallExpr(
  ctx: Context,
  callExpr: NodePath<T.CallExpression>
) {
  const args = callExpr.get("arguments");
  const params = args.map((arg) => {
    const param = getStringValueFromPath(ctx, arg);
    if (param == null) {
      throw createError(
        arg,
        `${ctx.name}() macro only accepts compile time parameters`
      );
    }
    return param;
  });

  return params;
}

function collectParamsFromTaggedTemplateExpr(
  ctx: Context,
  taggedTemplateExpr: NodePath<T.TaggedTemplateExpression>
) {
  const quasi = taggedTemplateExpr.get("quasi");
  const param = getStringValueFromPath(ctx, quasi);
  if (param == null) {
    throw createError(
      quasi,
      `${ctx.name}\`\` macro only accepts compile time values`
    );
  }
  return [param];
}

export function collectVariantsAndParams(ctx: Context, nodePath: NodePath) {
  const inner = (
    path: NodePath,
    variants: string[]
  ): Readonly<{
    path: NodePath;
    params: string[];
    variants: string[];
  }> => {
    if (path.isCallExpression()) {
      return {
        path,
        params: collectParamsFromCallExpr(ctx, path),
        variants,
      };
    }
    if (path.isTaggedTemplateExpression()) {
      return {
        path,
        params: collectParamsFromTaggedTemplateExpr(ctx, path),
        variants,
      };
    }
    if (path.isMemberExpression()) {
      const property = path.get("property");
      if (property.isIdentifier()) {
        return inner(path.parentPath, [...variants, property.node.name]);
      }
      const variant = getStringValueFromPath(ctx, property);
      if (variant != null) {
        return inner(path.parentPath, [...variants, variant]);
      }
      throw createError(
        property,
        `Member access of ${ctx.name} must be a compile time expression`
      );
    }
    throw createError(
      nodePath,
      `${ctx.name} is only allowed in a call expression or tagged template literal`
    );
  };
  return inner(nodePath.parentPath, []);
}
