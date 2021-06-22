import { Context } from "./context";

export function addVariants(
  { tailwindConfig: config }: Context,
  inputVariants: readonly string[],
  params: readonly string[]
) {
  const sep = config.separator;
  const screens = { ...config.theme.screens };
  const { screen, dark, variants } = normalizeVariants(screens, inputVariants);

  let result = "";
  for (const param of params) {
    for (const item of param.split(/\s+/)) {
      const {
        className,
        screen: itemScreen,
        dark: itemDark,
        variants: itemVariants,
      } = parseItem(screens, sep, item);
      if (screen != null || itemScreen != null) {
        result += (screen || itemScreen) + sep;
      }
      if (dark || itemDark) {
        result += "dark" + sep;
      }
      for (const variant of variants) {
        if (itemVariants.find((v) => v === variant)) continue;
        result += variant + sep;
      }
      for (const variant of itemVariants) {
        result += variant + sep;
      }
      result += className + " ";
    }
  }
  if (result.length > 0) {
    result = result.slice(0, -1);
  }
  return result;
}

function normalizeVariants(
  screens: Record<string, unknown>,
  inputVariants: readonly string[]
) {
  let screen: string | undefined;
  let dark: boolean = false;
  const variants: string[] = [];

  for (const variant of inputVariants) {
    if (variant in screens) {
      screen = variant;
    } else if (variant === "dark") {
      dark = true;
    } else {
      // camel case -> kebab case
      const normalized = variant.replace(
        /[A-Z]/g,
        (substr) => `-${substr.toLowerCase()}`
      );
      variants.push(normalized);
    }
  }

  return { screen, dark, variants } as const;
}

function parseItem(
  screens: Record<string, unknown>,
  sep: string,
  item: string
) {
  let screen: string | undefined;
  let dark: boolean = false;
  const variants: string[] = [];

  const parsed = item.split(sep);
  const className = parsed.pop() ?? "";

  for (const variant of parsed) {
    if (variant in screens) {
      screen = variant;
    } else if (variant === "dark") {
      dark = true;
    } else {
      variants.push(variant);
    }
  }

  return {
    className,
    screen,
    dark,
    variants,
  } as const;
}
