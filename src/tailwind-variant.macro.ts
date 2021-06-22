import path from "path";
import fs from "fs";
import type { TailwindConfig } from "tailwindcss/tailwind-config";
import resolveConfig from "tailwindcss/resolveConfig";
import { createMacro } from "babel-plugin-macros";
import type { NodePath } from "@babel/traverse";
import { transformReference } from "./transformReference";

function loadTailwindConfig(sourceRoot: string, configFile: string) {
  const configPath = path.resolve(sourceRoot, configFile);
  if (fs.existsSync(configPath)) {
    return resolveConfig(require(configPath));
  } else {
    return resolveConfig({} as TailwindConfig);
  }
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
      transformReference(baseCtx, ref);
    }
  }
);
