import { compile } from "@mdx-js/mdx";
import dedent from "dedent";

import recmaMdxImportReact, { type ImportReactOptions } from "../src";

describe("recmaMdxImportReact", () => {
  // ******************************************
  test("should insert variable declaration", async () => {
    const compiledSource = await compile("hi", {
      outputFormat: "function-body",
      recmaPlugins: [recmaMdxImportReact],
    });

    expect(String(compiledSource)).toContain("const React = arguments[0].React;");
  });

  // ******************************************
  test("should insert React property into only imported components", async () => {
    const source = dedent`
      import Test1 from "./context/Test.mjs"
      import Test2 from "./context/Test.mjs"
      import Test3 from "./context/Test.jsx"
      import random from "./random.js"
      import ImageUrl from "./image.png"
      
      Hi {name} {random(1,10)}

      <Test1 />
      <Test2 />
      <Test3 />

      <img src={ImageUrl} alt="image" />
    `;

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      recmaPlugins: [recmaMdxImportReact],
    });

    expect(String(compiledSource)).toContain("const React = arguments[0].React;");

    expect(String(compiledSource)).toMatchInlineSnapshot(`
      ""use strict";
      const React = arguments[0].React;
      const {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];
      const _importMetaUrl = arguments[0].baseUrl;
      if (!_importMetaUrl) throw new Error("Unexpected missing \`options.baseUrl\` needed to support \`export … from\`, \`import\`, or \`import.meta.url\` when generating \`function-body\`");
      const {default: Test1} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      const {default: Test2} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      const {default: Test3} = await import(_resolveDynamicMdxSpecifier("./context/Test.jsx"));
      const {default: random} = await import(_resolveDynamicMdxSpecifier("./random.js"));
      const {default: ImageUrl} = await import(_resolveDynamicMdxSpecifier("./image.png"));
      function _createMdxContent(props) {
        const _components = {
          p: "p",
          ...props.components
        };
        return _jsxs(_Fragment, {
          children: [_jsxs(_components.p, {
            children: ["Hi ", name, " ", random(1, 10)]
          }), "\\n", _jsx(Test1, {
            React
          }), "\\n", _jsx(Test2, {
            React
          }), "\\n", _jsx(Test3, {
            React
          }), "\\n", _jsx("img", {
            src: ImageUrl,
            alt: "image"
          })]
        });
      }
      function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? _jsx(MDXLayout, {
          ...props,
          children: _jsx(_createMdxContent, {
            ...props
          })
        }) : _createMdxContent(props);
      }
      return {
        default: MDXContent
      };
      function _resolveDynamicMdxSpecifier(d) {
        if (typeof d !== "string") return d;
        try {
          new URL(d);
          return d;
        } catch {}
        if (d.startsWith("/") || d.startsWith("./") || d.startsWith("../")) return new URL(d, _importMetaUrl).href;
        return d;
      }
      "
    `);
  });

  // ******************************************
  test("shouldn't insert any with the options are undefined", async () => {
    const source = dedent`
      import Test1 from "./context/Test.mjs"
      import Test2 from "./context/Test.mjs"
      import Test3 from "./context/Test.jsx"
      import random from "./random.js"
      import ImageUrl from "./image.png"
      
      Hi {name} {random(1,10)}

      <Test1 />
      <Test2 />
      <Test3 />

      <img src={ImageUrl} alt="image" />
    `;

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      recmaPlugins: [
        [
          recmaMdxImportReact,
          {
            argumentsToBeAdded: undefined,
            propertiesToBeInjected: undefined,
          } as ImportReactOptions,
        ],
      ],
    });

    expect(String(compiledSource)).not.toContain("const React = arguments[0].React;");

    expect(String(compiledSource)).toMatchInlineSnapshot(`
      ""use strict";
      const {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];
      const _importMetaUrl = arguments[0].baseUrl;
      if (!_importMetaUrl) throw new Error("Unexpected missing \`options.baseUrl\` needed to support \`export … from\`, \`import\`, or \`import.meta.url\` when generating \`function-body\`");
      const {default: Test1} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      const {default: Test2} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      const {default: Test3} = await import(_resolveDynamicMdxSpecifier("./context/Test.jsx"));
      const {default: random} = await import(_resolveDynamicMdxSpecifier("./random.js"));
      const {default: ImageUrl} = await import(_resolveDynamicMdxSpecifier("./image.png"));
      function _createMdxContent(props) {
        const _components = {
          p: "p",
          ...props.components
        };
        return _jsxs(_Fragment, {
          children: [_jsxs(_components.p, {
            children: ["Hi ", name, " ", random(1, 10)]
          }), "\\n", _jsx(Test1, {}), "\\n", _jsx(Test2, {}), "\\n", _jsx(Test3, {}), "\\n", _jsx("img", {
            src: ImageUrl,
            alt: "image"
          })]
        });
      }
      function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? _jsx(MDXLayout, {
          ...props,
          children: _jsx(_createMdxContent, {
            ...props
          })
        }) : _createMdxContent(props);
      }
      return {
        default: MDXContent
      };
      function _resolveDynamicMdxSpecifier(d) {
        if (typeof d !== "string") return d;
        try {
          new URL(d);
          return d;
        } catch {}
        if (d.startsWith("/") || d.startsWith("./") || d.startsWith("../")) return new URL(d, _importMetaUrl).href;
        return d;
      }
      "
    `);
  });

  // ******************************************
  test("should insert arguments and properties", async () => {
    const source = dedent`
      import Test1 from "./context/Test.mjs"
      import Test2 from "./context/Test.mjs"
      import Test3 from "./context/Test.jsx"
      import random from "./random.js"
      import ImageUrl from "./image.png"
      
      Hi {name} {random(1,10)}

      <Test1 other={2} />
      <Test2 other="me" />
      <Test3 other={re} />

      <img src={ImageUrl} alt="image" />
    `;

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      recmaPlugins: [
        [
          recmaMdxImportReact,
          {
            argumentsToBeAdded: ["React", "Preact"],
            propertiesToBeInjected: [
              ["React", "React"],
              ["Fragment", "_Fragment"],
              ["jsx", "_jsx"],
              ["jsxs", "_jsxs"],
            ],
          } as ImportReactOptions,
        ],
      ],
    });

    expect(String(compiledSource)).toMatchInlineSnapshot(`
      ""use strict";
      const React = arguments[0].React;
      const Preact = arguments[0].Preact;
      const {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];
      const _importMetaUrl = arguments[0].baseUrl;
      if (!_importMetaUrl) throw new Error("Unexpected missing \`options.baseUrl\` needed to support \`export … from\`, \`import\`, or \`import.meta.url\` when generating \`function-body\`");
      const {default: Test1} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      const {default: Test2} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      const {default: Test3} = await import(_resolveDynamicMdxSpecifier("./context/Test.jsx"));
      const {default: random} = await import(_resolveDynamicMdxSpecifier("./random.js"));
      const {default: ImageUrl} = await import(_resolveDynamicMdxSpecifier("./image.png"));
      function _createMdxContent(props) {
        const _components = {
          p: "p",
          ...props.components
        };
        return _jsxs(_Fragment, {
          children: [_jsxs(_components.p, {
            children: ["Hi ", name, " ", random(1, 10)]
          }), "\\n", _jsx(Test1, {
            React,
            Fragment: _Fragment,
            jsx: _jsx,
            jsxs: _jsxs,
            other: 2
          }), "\\n", _jsx(Test2, {
            React,
            Fragment: _Fragment,
            jsx: _jsx,
            jsxs: _jsxs,
            other: "me"
          }), "\\n", _jsx(Test3, {
            React,
            Fragment: _Fragment,
            jsx: _jsx,
            jsxs: _jsxs,
            other: re
          }), "\\n", _jsx("img", {
            src: ImageUrl,
            alt: "image"
          })]
        });
      }
      function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? _jsx(MDXLayout, {
          ...props,
          children: _jsx(_createMdxContent, {
            ...props
          })
        }) : _createMdxContent(props);
      }
      return {
        default: MDXContent
      };
      function _resolveDynamicMdxSpecifier(d) {
        if (typeof d !== "string") return d;
        try {
          new URL(d);
          return d;
        } catch {}
        if (d.startsWith("/") || d.startsWith("./") || d.startsWith("../")) return new URL(d, _importMetaUrl).href;
        return d;
      }
      "
    `);
  });

  // ******************************************
  test("example in the readme", async () => {
    const source = dedent`
      import Test from "./context/Test.mjs"
      
      Hello world !

      <Test />
    `;

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      recmaPlugins: [recmaMdxImportReact],
    });

    expect(String(compiledSource)).toMatchInlineSnapshot(`
      ""use strict";
      const React = arguments[0].React;
      const {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];
      const _importMetaUrl = arguments[0].baseUrl;
      if (!_importMetaUrl) throw new Error("Unexpected missing \`options.baseUrl\` needed to support \`export … from\`, \`import\`, or \`import.meta.url\` when generating \`function-body\`");
      const {default: Test} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      function _createMdxContent(props) {
        const _components = {
          p: "p",
          ...props.components
        };
        return _jsxs(_Fragment, {
          children: [_jsx(_components.p, {
            children: "Hello world !"
          }), "\\n", _jsx(Test, {
            React
          })]
        });
      }
      function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? _jsx(MDXLayout, {
          ...props,
          children: _jsx(_createMdxContent, {
            ...props
          })
        }) : _createMdxContent(props);
      }
      return {
        default: MDXContent
      };
      function _resolveDynamicMdxSpecifier(d) {
        if (typeof d !== "string") return d;
        try {
          new URL(d);
          return d;
        } catch {}
        if (d.startsWith("/") || d.startsWith("./") || d.startsWith("../")) return new URL(d, _importMetaUrl).href;
        return d;
      }
      "
    `);
  });
});
