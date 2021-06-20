import pluginTester from "babel-plugin-tester";
import macrosPlugin from "babel-plugin-macros";

const tw = `import { tw } from "./tailwind-variant.macro";`;

pluginTester({
  plugin: macrosPlugin,
  pluginName: "tailwind-variant.macro",
  babelOptions: {
    filename: __filename,
    presets: ["@babel/preset-typescript"],
  },
  tests: {
    "single string literal": {
      code: `
				${tw}
				tw("bg-red-500");
			`,
      output: `
				"bg-red-500";
			`,
    },
    "multiple string literals": {
      code: `
				${tw}
				tw("bg-red-500", "text-bold  w-full");
			`,
      output: `
				"bg-red-500 text-bold w-full";
			`,
    },
    "variant(identifer access)": {
      code: `
				${tw}
				tw.hover("bg-red-500");
			`,
      output: `
				"hover:bg-red-500";
			`,
    },
    "variant(index access)": {
      code: `
				${tw}
				tw["focus-visible"]("ring");
			`,
      output: `
				"focus-visible:ring";
			`,
    },
    "multiple variant": {
      code: `
				${tw}
				tw.md.hover("ring");
			`,
      output: `
				"md:hover:ring";
			`,
    },
  },
});
