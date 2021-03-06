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
    nested: {
      code: `
        ${tw}
        tw.md(tw.hover("ring"));
      `,
      output: `
        "md:hover:ring";
      `,
    },
    "tagged template literal": {
      code: `
        ${tw}
        tw.hover\`ring\`;
      `,
      output: `
        "hover:ring";
      `,
    },
    "overlapped variants": {
      code: `
        ${tw}
        tw.hover("text-opacity-50 md:hover:ring");
      `,
      output: `
        "hover:text-opacity-50 md:hover:ring";
      `,
    },
    screen: {
      code: `
        ${tw}
        tw.sm("md:ring");
      `,
      output: `
        "sm:ring";
      `,
    },
    dark: {
      code: `
        ${tw}
        tw.hover(tw.dark("ring"));
      `,
      output: `
        "dark:hover:ring";
      `,
    },
    "constant in module": {
      code: `
        ${tw}
        const styles = "ring";
        {
          tw(styles);
        }
      `,
      output: `
        const styles = "ring";
        {
          ("ring");
        }
      `,
    },
    "nested call in constant": {
      code: `
        ${tw}
        const styles = tw.md("ring");
        tw(tw.focus(styles), tw.hover(styles));
      `,
      output: `
        const styles = "md:ring";
        ("md:focus:ring md:hover:ring");
      `,
    },
    "camel case variants": {
      code: `
        ${tw}
        tw.focusVisible("ring");
      `,
      output: `
        "focus-visible:ring";
      `,
    },
  },
});
