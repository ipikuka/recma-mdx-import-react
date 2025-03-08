# recma-mdx-import-react

[![npm version][badge-npm-version]][url-npm-package]
[![npm downloads][badge-npm-download]][url-npm-package]
[![publish to npm][badge-publish-to-npm]][url-publish-github-actions]
[![code-coverage][badge-codecov]][url-codecov]
[![type-coverage][badge-type-coverage]][url-github-package]
[![typescript][badge-typescript]][url-typescript]
[![license][badge-license]][url-license]

This package is a **[unified][unified]** (**[recma][recma]**) plugin **that ensures getting React from argument[0] and inject it as property into the imported components in the compiled source.**

**[unified][unified]** is a project that transforms content with abstract syntax trees (ASTs) using the new parser **[micromark][micromark]**. **[recma][recma]** adds support for producing a javascript code by transforming **[esast][esast]** which stands for Ecma Script Abstract Syntax Tree (AST) that is used in production of compiled source for the **[MDX][MDX]**.

## When should I use this?

It is a work around for the issues
 * https://github.com/vercel/next.js/issues/76395
 * https://github.com/ipikuka/next-mdx-remote-client/issues/9

**You should insert `React` instance into function construction arguments to get it in the compiled source !**

## Installation

This package is suitable for ESM only. In Node.js (version 18+), install with npm:

```bash
npm install recma-mdx-import-react
```

or

```bash
yarn add recma-mdx-import-react
```

## Usage

Say we have the following file, `example.mdx`,

```mdx
import Test from "./context/Test.mjs"

Hello world !

<Test />
```

And our module, `example.js`, looks as follows:

```javascript
import { read } from "to-vfile";
import { compile } from "@mdx-js/mdx";
import recmaMdxImportReact from "recma-mdx-import-react";

main();

async function main() {
  const source = await read("example.mdx");

  const compiledSource = await compile(source, {
    recmaPlugins: [recmaMdxImportReact],
  });

  return String(compiledSource);
}
```

Now, running `node example.js` produces the `compiled source` like below:

```diff
// ...
+ const React = arguments[0].React;
const {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];
// ...
const {default: Test} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
function _createMdxContent(props) {
  // ...
  return _jsxs(_Fragment, {
    // ...
-   _jsx(Test, {})
+   _jsx(Test, { React })
    // ...
  })
}
```

## Options

All options are optional.

```typescript
export type ImportReactOptions = {
  argumentsToBeAdded?: string[];
  propertiesToBeInjected?: [string, string][]; // array of [key, value] tuples
};
```

### argumentsToBeAdded

It is an **array** option to get arguments from arguments[0] in the compiled source.

The default is `["React"]`.

```javascript
use(recmaMdxImportReact, { argumentsToBeAdded: ["Preact"] } as ImportReactOptions);
```

Now the statement will be `const Preact = arguments[0].Preact;` in the compiled source.

### propertiesToBeInjected

It is an **array of key, value tuple** option to inject properties into the imported components in the compiled source.

The default is `[["React", "React"]]`.

```javascript
use(recmaMdxImportReact, { propertiesToBeInjected: [["React", "React"], ["jsx": "_jsx"]] } as ImportReactOptions);
```

Now, both `{ React, jsx: _jsx }` properties will be injected to the imported components in the compiled source.

## Syntax tree

This plugin only modifies the ESAST (Ecma Script Abstract Syntax Tree) as explained.

## Types

This package is fully typed with [TypeScript][url-typescript]. The plugin options is exported as `ImportReactOptions`.

## Compatibility

This plugin works with `unified` version 6+. It is compatible with `mdx` version 3+.

## Security

Use of `recma-mdx-import-react` does not involve user content so there are no openings for cross-site scripting (XSS) attacks.

## My Plugins

I like to contribute the Unified / Remark / MDX ecosystem, so I recommend you to have a look my plugins.

### My Remark Plugins

- [`remark-flexible-code-titles`](https://www.npmjs.com/package/remark-flexible-code-titles)
  – Remark plugin to add titles or/and containers for the code blocks with customizable properties
- [`remark-flexible-containers`](https://www.npmjs.com/package/remark-flexible-containers)
  – Remark plugin to add custom containers with customizable properties in markdown
- [`remark-ins`](https://www.npmjs.com/package/remark-ins)
  – Remark plugin to add `ins` element in markdown
- [`remark-flexible-paragraphs`](https://www.npmjs.com/package/remark-flexible-paragraphs)
  – Remark plugin to add custom paragraphs with customizable properties in markdown
- [`remark-flexible-markers`](https://www.npmjs.com/package/remark-flexible-markers)
  – Remark plugin to add custom `mark` element with customizable properties in markdown
- [`remark-flexible-toc`](https://www.npmjs.com/package/remark-flexible-toc)
  – Remark plugin to expose the table of contents via `vfile.data` or via an option reference
- [`remark-mdx-remove-esm`](https://www.npmjs.com/package/remark-mdx-remove-esm)
  – Remark plugin to remove import and/or export statements (mdxjsEsm)

### My Rehype Plugins

- [`rehype-pre-language`](https://www.npmjs.com/package/rehype-pre-language)
  – Rehype plugin to add language information as a property to `pre` element
- [`rehype-highlight-code-lines`](https://www.npmjs.com/package/rehype-highlight-code-lines)
  – Rehype plugin to add line numbers to code blocks and allow highlighting of desired code lines

### My Recma Plugins

- [`recma-mdx-escape-missing-components`](https://www.npmjs.com/package/recma-mdx-escape-missing-components)
  – Recma plugin to set the default value `() => null` for the Components in MDX in case of missing or not provided so as not to throw an error
- [`recma-mdx-change-props`](https://www.npmjs.com/package/recma-mdx-change-props)
  – Recma plugin to change the `props` parameter into the `_props` in the `function _createMdxContent(props) {/* */}` in the compiled source in order to be able to use `{props.foo}` like expressions. It is useful for the `next-mdx-remote` or `next-mdx-remote-client` users in `nextjs` applications.
- [`recma-mdx-change-imports`](https://www.npmjs.com/package/recma-mdx-change-imports)
  – Recma plugin to convert import declarations for assets and media with relative links into variable declarations with string URLs, enabling direct asset URL resolution in compiled MDX.
- [`recma-mdx-import-media`](https://www.npmjs.com/package/recma-mdx-import-media)
  – Recma plugin to turn media relative paths into import declarations for both markdown and html syntax in MDX.
- [`recma-mdx-import-react`](https://www.npmjs.com/package/recma-mdx-import-react)
  – Recma plugin to ensure getting React from arguments and and inject it as property into the imported components in the compiled source.

## License

[MIT License](./LICENSE) © ipikuka

[unified]: https://github.com/unifiedjs/unified
[micromark]: https://github.com/micromark/micromark
[recma]: https://mdxjs.com/docs/extending-mdx/#list-of-plugins
[esast]: https://github.com/syntax-tree/esast
[estree]: https://github.com/estree/estree
[MDX]: https://mdxjs.com/

[badge-npm-version]: https://img.shields.io/npm/v/recma-mdx-import-react
[badge-npm-download]:https://img.shields.io/npm/dt/recma-mdx-import-react
[url-npm-package]: https://www.npmjs.com/package/recma-mdx-import-react
[url-github-package]: https://github.com/ipikuka/recma-mdx-import-react

[badge-license]: https://img.shields.io/github/license/ipikuka/recma-mdx-import-react
[url-license]: https://github.com/ipikuka/recma-mdx-import-react/blob/main/LICENSE

[badge-publish-to-npm]: https://github.com/ipikuka/recma-mdx-import-react/actions/workflows/publish.yml/badge.svg
[url-publish-github-actions]: https://github.com/ipikuka/recma-mdx-import-react/actions/workflows/publish.yml

[badge-typescript]: https://img.shields.io/npm/types/recma-mdx-import-react
[url-typescript]: https://www.typescriptlang.org/

[badge-codecov]: https://codecov.io/gh/ipikuka/recma-mdx-import-react/graph/badge.svg?token=kyhrfChvkO
[url-codecov]: https://codecov.io/gh/ipikuka/recma-mdx-import-react

[badge-type-coverage]: https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fipikuka%2Frecma-mdx-import-react%2Fmaster%2Fpackage.json
