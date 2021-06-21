import type { TailwindConfig } from "tailwindcss/tailwind-config";

export function addVariants(
  config: TailwindConfig,
  inputVariants: readonly string[],
  params: readonly string[]
) {
  const sep = config.separator;
  const screens = { ...config.theme.screens };
  const { screen, variants } = normalizeVariants(screens, inputVariants);

  let result = "";
  for (const param of params) {
    for (const item of param.split(/\s+/)) {
      const {
        className,
        screen: itemScreen,
        variants: itemVariants,
      } = parseItem(screens, sep, item);
      if (screen != null || itemScreen != null) {
        result += (screen || itemScreen) + sep;
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
  const variants: string[] = [];

  for (const variant of inputVariants) {
    if (variant in screens) {
      screen = variant;
    } else {
      variants.push(variant);
    }
  }

  return { screen, variants } as const;
}

function parseItem(
  screens: Record<string, unknown>,
  sep: string,
  item: string
) {
  let screen: string | undefined;
  const variants: string[] = [];

  const parsed = item.split(sep);
  const className = parsed.pop() ?? "";

  for (const variant of parsed) {
    if (variant in screens) {
      screen = variant;
    } else {
      variants.push(variant);
    }
  }

  return {
    className,
    screen,
    variants,
  } as const;
}
