import type { NodePath } from "@babel/traverse";
import type * as T from "@babel/types";
import { Context } from "./context";
import { transformReference } from "./transformReference";

function getValueFromTemplateElement(
  templateElement: T.TemplateElement
): string {
  return templateElement.value.cooked ?? templateElement.value.raw;
}

export function getStringValueFromPath(
  ctx: Context,
  expr: NodePath
): string | undefined {
  if (expr.isCallExpression() || expr.isTaggedTemplateExpression()) {
    const ref = ctx.refs.find((r) => expr.isAncestor(r));
    if (ref == null) return;
    transformReference(ctx, ref);
  }

  if (expr.isStringLiteral()) {
    return expr.node.value;
  }
  if (expr.isTemplateLiteral()) {
    const expressions = expr.get("expressions");
    const strings = expressions.map((e) => getStringValueFromPath(ctx, e));
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

    return getStringValueFromPath(ctx, init);
  }
  return undefined;
}
