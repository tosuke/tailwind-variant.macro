import { createMacro } from "babel-plugin-macros";
import type * as T from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { createError } from "./createError";

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

function getStringValue(expr: NodePath): string | undefined {
  if (expr.isStringLiteral()) {
    return expr.node.value;
  }
  if (expr.isTemplateLiteral()) {
    const expressions = expr.get("expressions");
    const strings = expressions.map(getStringValue);
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
  return undefined;
}

function getTwCallOrTaggedTemplateExpr(
  name: string,
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
      return getTwCallOrTaggedTemplateExpr(name, path.parentPath, [
        ...variants,
        variant,
      ]);
    }
    const variant = getStringValue(property);
    if (variant != null) {
      return getTwCallOrTaggedTemplateExpr(name, path.parentPath, [
        ...variants,
        variant,
      ]);
    }
    throw createError(
      property,
      `Member access of ${name} must be a compile time expression`
    );
  }
  throw createError(
    path,
    `${name} is only allowed in a call or tagged template expression`
  );
}

function collectParamsFromCallExpr(
  name: string,
  callExpr: NodePath<T.CallExpression>
) {
  const args = callExpr.get("arguments");
  const params = args.map((arg) => {
    const param = getStringValue(arg);
    if (param == null) {
      throw createError(
        arg,
        `${name}() macro only accepts compile time parameters`
      );
    }
    return param;
  });

  return params;
}

function collectParamsFromTaggedTemplateExpr(
  name: string,
  taggedTemplateExpr: NodePath<T.TaggedTemplateExpression>
) {
  const quasi = taggedTemplateExpr.get("quasi");
  const param = getStringValue(quasi);
  if (param == null) {
    throw createError(
      quasi,
      `${name}\`\` macro only accepts compile time values`
    );
  }
  return [param];
}

function collectParams(
  name: string,
  callOrTaggedTemplateExpr: NodePath<
    T.CallExpression | T.TaggedTemplateExpression
  >
): string[] {
  if (callOrTaggedTemplateExpr.isCallExpression()) {
    return collectParamsFromCallExpr(name, callOrTaggedTemplateExpr);
  }
  if (callOrTaggedTemplateExpr.isTaggedTemplateExpression()) {
    return collectParamsFromTaggedTemplateExpr(name, callOrTaggedTemplateExpr);
  }
  throw new Error("unreachable");
}

function transpileTailwindUtilities(
  variants: readonly string[],
  params: readonly string[]
): string {
  const prefix =
    " " + variants.reduce((pre, variant) => pre + variant + ":", "");
  let result = "";
  for (const param of params) {
    for (const value of param.split(/\s+/)) {
      result += prefix;
      result += value;
    }
  }
  if (result.length > 0) {
    result = result.slice(1);
  }
  return result;
}

export default createMacro(({ references, babel: { types: t } }) => {
  // reverse nodes for nested call
  for (const ref of references["tw"].reverse()) {
    assertIdentifier(ref);
    const name = ref.node.name;

    const { expr, variants } = getTwCallOrTaggedTemplateExpr(
      name,
      ref.parentPath,
      []
    );

    const params = collectParams(name, expr);

    const transpiled = transpileTailwindUtilities(variants, params);

    expr.replaceWith(t.stringLiteral(transpiled));
  }
});
