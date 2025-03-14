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
            runtimeProps: {
              React
            }
          }), "\\n", _jsx(Test2, {
            runtimeProps: {
              React
            }
          }), "\\n", _jsx(Test3, {
            runtimeProps: {
              React
            }
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
            arguments: undefined,
            runtimeProps: undefined,
          } satisfies ImportReactOptions,
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
            arguments: ["React", "Preact"],
            runtimeProps: ["React", "jsx-runtime"],
          } satisfies ImportReactOptions,
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
            runtimeProps: {
              React,
              Fragment,
              jsx: _jsx,
              jsxs: _jsxs,
              jsxDev: _jsxDev
            },
            other: 2
          }), "\\n", _jsx(Test2, {
            runtimeProps: {
              React,
              Fragment,
              jsx: _jsx,
              jsxs: _jsxs,
              jsxDev: _jsxDev
            },
            other: "me"
          }), "\\n", _jsx(Test3, {
            runtimeProps: {
              React,
              Fragment,
              jsx: _jsx,
              jsxs: _jsxs,
              jsxDev: _jsxDev
            },
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
  test("should insert arguments and properties in dynamicly imported components", async () => {
    const source = dedent`
      import Test1 from "./context/Test.mjs";

      export const Test2 = (await import("./context/Test.mjs")).default;

      export const {default: Test3} = await import("./context/Test.mjs");

      <Test1 />

      <Test2 />

      <Test3 />
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
      const {default: Test1} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      const Test2 = (await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"))).default;
      const {default: Test3} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      function _createMdxContent(props) {
        return _jsxs(_Fragment, {
          children: [_jsx(Test1, {
            runtimeProps: {
              React
            }
          }), "\\n", _jsx(Test2, {
            runtimeProps: {
              React
            }
          }), "\\n", _jsx(Test3, {
            runtimeProps: {
              React
            }
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
        Test2,
        Test3,
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
  test("should ensure the jsx runtime is available in the compiled source", async () => {
    const source = dedent`
      import Test from "./context/Test.mjs"
           
      Hi

      <Test source={"Hi"} />
    `;

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      recmaPlugins: [
        [
          recmaMdxImportReact,
          {
            runtimeProps: ["React", "jsx-dev-runtime"],
          } satisfies ImportReactOptions,
        ],
      ],
    });

    expect(String(compiledSource)).toContain(dedent`
      const {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs, jsxDev: _jsxDev} = arguments[0];
    `);
  });

  // ******************************************
  test("should ensure the jsx runtime is available in the compiled source 2", async () => {
    const source = "Hi";

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      recmaPlugins: [
        [
          recmaMdxImportReact,
          {
            runtimeProps: ["React", "jsx-runtime", "jsx-dev-runtime"],
          } satisfies ImportReactOptions,
        ],
      ],
    });

    expect(String(compiledSource)).toContain(dedent`
      const {jsx: _jsx, Fragment: Fragment, jsxs: _jsxs, jsxDev: _jsxDev} = arguments[0];
    `);
  });

  // ******************************************
  test("should ensure the jsx runtime is available in the compiled source, development is true", async () => {
    const source = "Hi";

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      development: true,
      recmaPlugins: [
        [
          recmaMdxImportReact,
          {
            runtimeProps: ["React", "jsx-runtime"],
          } satisfies ImportReactOptions,
        ],
      ],
    });

    expect(String(compiledSource)).toContain(dedent`
      const {jsxDEV: _jsxDEV, Fragment: Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];
    `);
  });

  // ******************************************
  test("should ensure additional runtime (baseUrl) is available for imported components", async () => {
    const source = dedent`
      import Test from "./context/Test.mjs"
           
      <Test source={"Hi"} />
    `;

    const compiledSource = await compile(source, {
      outputFormat: "function-body",
      recmaPlugins: [
        [
          recmaMdxImportReact,
          {
            arguments: ["React"],
            runtimeProps: ["React", ["baseUrl", "baseUrl"]],
          } satisfies ImportReactOptions,
        ],
      ],
    });

    expect(String(compiledSource)).toMatchInlineSnapshot(`
      ""use strict";
      const React = arguments[0].React;
      const {jsx: _jsx} = arguments[0];
      const _importMetaUrl = arguments[0].baseUrl;
      if (!_importMetaUrl) throw new Error("Unexpected missing \`options.baseUrl\` needed to support \`export … from\`, \`import\`, or \`import.meta.url\` when generating \`function-body\`");
      const {default: Test} = await import(_resolveDynamicMdxSpecifier("./context/Test.mjs"));
      function _createMdxContent(props) {
        return _jsx(Test, {
          runtimeProps: {
            React,
            baseUrl
          },
          source: "Hi"
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

      <Test source={source} />
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
            runtimeProps: {
              React
            },
            source: source
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
