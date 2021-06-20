import { createMacro } from "babel-plugin-macros";
import type * as T from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { createError } from "./createError";

function assertIdentifier(
  nodePath: NodePath
): asserts nodePath is NodePath<T.Identifier> {
  nodePath.assertIdentifier();
}

function getTwCallExpr(
  name: string,
  path: NodePath,
  variants: string[]
): Readonly<{ callExpr: NodePath<T.CallExpression>; variants: string[] }> {
  if (path.isCallExpression()) {
    return {
      callExpr: path,
      variants,
    } as const;
  }
  if (path.isMemberExpression()) {
    const property = path.get("property");
    if (property.isIdentifier()) {
      const variant = property.node.name;
      return getTwCallExpr(name, path.parentPath, [...variants, variant]);
    }
    if (property.isStringLiteral()) {
      const variant = property.node.value;
      return getTwCallExpr(name, path.parentPath, [...variants, variant]);
    }
    throw createError(
      property,
      `Member access of ${name} must be a compile time expression`
    );
  }
  throw createError(path, `${name}() is only allowed in a call expression`);
}

export default createMacro(({ references, babel: { types: t } }) => {
  for (const ref of references["tw"]) {
    assertIdentifier(ref);
    const name = ref.node.name;

    const { callExpr, variants } = getTwCallExpr(name, ref.parentPath, []);
    const prefix = variants.reduce((pre, variant) => pre + variant + ":", "");

    const args = callExpr.get("arguments");

    let result = "";
    for (const arg of args) {
      if (!arg.isStringLiteral()) {
        throw createError(
          arg,
          `${name}() macro only accepts StringLiteral parameters`
        );
      }

      for (const value of arg.node.value.split(/\s+/)) {
        result += " ";
        result += prefix + value;
      }
    }
    if (result.length > 0) {
      result = result.slice(1);
    }

    callExpr.replaceWith(t.stringLiteral(result));
  }
});
