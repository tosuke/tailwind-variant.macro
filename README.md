A [Babel Macro](https://github.com/kentcdodds/babel-plugin-macros) that apply [Tailwind](https://tailwindcss.com/) Screen / Variant to multiple utility classes

[![Babel Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg?style=flat-square)](https://github.com/kentcdodds/babel-plugin-macros)

## Example

```javascript
import { tw } from "tailwind-variant.macro";

const className = tw.disabled`cursor-not-allowed opacity-50`;
```

This code is transpiled into:

```javascript
const className = "disabled:cursor-not-allowed opacity-50";
```
