import path from "path";
import fs from "fs";
import type { TailwindConfig } from "tailwindcss/tailwind-config";
import resolveConfig from "tailwindcss/resolveConfig";
import { createMacro } from "babel-plugin-macros";
import type * as T from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { Context } from "./context";
import { createError } from "./createError";
import { addVariants } from "./addVariants";

function assertIdentifier(
  nodePath: NodePath
): asserts nodePath is NodePath<T.Identifier> {
  nodePath.assertIdentifier();
}

function getValueFromTemplateElement(
  templateElement: T.TemplateElement
): string {
  return templateElement.value.cooked ?? templateElement.value.raw;
}

function getStringValue(ctx: Context, expr: NodePath): string | undefined {
  if (expr.isCallExpression() || expr.isTaggedTemplateExpression()) {
    const ref = ctx.refs.find((r) => expr.isAncestor(r));
    if (ref == null) return;
    transformRef(ctx, ref);
  }

  if (expr.isStringLiteral()) {
    return expr.node.value;
  }
  if (expr.isTemplateLiteral()) {
    const expressions = expr.get("expressions");
    const strings = expressions.map((e) => getStringValue(ctx, e));
    if (!strings.every((x: unknown): x is string => x != null)) {
      return undefined;
    }
    const quasis = expr.node.quasis;

    let result = getValueFromTemplateElement(quasis[0]);
    for (let i = 0; i < strings.length; i++) {
      result += strings[i];
      result += getValueFromTemplateElement(quasis[i + 1]);
    }
    return result;
  }
  if (expr.isIdentifier()) {
    const name = expr.node.name;

    const binding = expr.scope.getBinding(name);
    if (binding == null || binding.kind !== "const") return;

    const decl = binding.path;
    if (!decl.isVariableDeclarator()) return;

    const id = decl.get("id");
    if (!id.isIdentifier()) return;

    const init = decl.get("init");
    if (!init.isExpression()) return;

    return getStringValue(ctx, init);
  }
  return undefined;
}

function getTwCallOrTaggedTemplateExpr(
  ctx: Context,
  path: NodePath,
  variants: string[]
): Readonly<{
  expr: NodePath<T.CallExpression | T.TaggedTemplateExpression>;
  variants: string[];
}> {
  if (path.isCallExpression() || path.isTaggedTemplateExpression()) {
    return {
      expr: path,
      variants,
    } as const;
  }
  if (path.isMemberExpression()) {
    const property = path.get("property");
    if (property.isIdentifier()) {
      const variant = property.node.name;
      return getTwCallOrTaggedTemplateExpr(ctx, path.parentPath, [
        ...variants,
        variant,
      ]);
    }
    const variant = getStringValue(ctx, property);
    if (variant != null) {
      return getTwCallOrTaggedTemplateExpr(ctx, path.parentPath, [
        ...variants,
        variant,
      ]);
    }
    throw createError(
      property,
      `Member access of ${ctx.name} must be a compile time expression`
    );
  }
  throw createError(
    path,
    `${ctx.name} is only allowed in a call or tagged template expression`
  );
}

function collectParamsFromCallExpr(
  ctx: Context,
  callExpr: NodePath<T.CallExpression>
) {
  const args = callExpr.get("arguments");
  const params = args.map((arg) => {
    const param = getStringValue(ctx, arg);
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
  const param = getStringValue(ctx, quasi);
  if (param == null) {
    throw createError(
      quasi,
      `${ctx.name}\`\` macro only accepts compile time values`
    );
  }
  return [param];
}

function collectParams(
  ctx: Context,
  callOrTaggedTemplateExpr: NodePath<
    T.CallExpression | T.TaggedTemplateExpression
  >
): string[] {
  if (callOrTaggedTemplateExpr.isCallExpression()) {
    return collectParamsFromCallExpr(ctx, callOrTaggedTemplateExpr);
  }
  if (callOrTaggedTemplateExpr.isTaggedTemplateExpression()) {
    return collectParamsFromTaggedTemplateExpr(ctx, callOrTaggedTemplateExpr);
  }
  throw new Error("unreachable");
}

function loadTailwindConfig(sourceRoot: string, configFile: string) {
  const configPath = path.resolve(sourceRoot, configFile);
  if (fs.existsSync(configPath)) {
    return resolveConfig(require(configPath));
  } else {
    return resolveConfig({} as TailwindConfig);
  }
}

function transformRef(baseCtx: Omit<Context, "name">, ref: NodePath) {
  if (baseCtx.transformedRef.has(ref)) return;

  assertIdentifier(ref);
  const name = ref.node.name;
  const ctx: Context = { ...baseCtx, name };
  const { t } = ctx;

  const { expr, variants } = getTwCallOrTaggedTemplateExpr(
    ctx,
    ref.parentPath,
    []
  );

  const params = collectParams(ctx, expr);

  const transpiled = addVariants(ctx, variants, params);

  expr.replaceWith(t.stringLiteral(transpiled));

  ctx.transformedRef.add(ref);
}

export default createMacro(
  ({ references, state, config, babel: { types: t } }) => {
    const configFile =
      typeof config?.config === "string"
        ? config?.config
        : "tailwind.config.js";
    const sourceRoot = state.file.opts.sourceRoot || ".";
    const tailwindConfig = loadTailwindConfig(sourceRoot, configFile);

    const refs = references["tw"] ?? [];
    const baseCtx = {
      t,
      tailwindConfig,
      refs,
      transformedRef: new WeakSet<NodePath>(),
    } as const;

    for (const ref of refs) {
      transformRef(baseCtx, ref);
    }
  }
);
