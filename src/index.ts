import type { Plugin } from "unified";
import type { Node, Program, Property, VariableDeclaration } from "estree";
import { CONTINUE, EXIT, SKIP, visit } from "estree-util-visit";

export type ImportReactOptions = {
  arguments?: string[];
  runtimeProps?: ("React" | "jsx-runtime" | "jsx-dev-runtime" | [string, string])[];
};

const DEFAULT_SETTINGS: ImportReactOptions = {
  arguments: ["React"],
  runtimeProps: ["React"],
};

const JSXRUNTIME = ["Fragment", "jsx", "jsxs"];
const JSXDEVRUNTIME = ["Fragment", "jsxDev"];
const MAP_OF_JSXRUNTIME = {
  Fragment: "_Fragment",
  jsx: "_jsx",
  jsxs: "_jsxs",
  jsxDev: "_jsxDev",
};

/**
 *
 * compose variable declaration for getting an argument into the compiled source
 *
 */
function composeVariableDeclaration(name: string): VariableDeclaration {
  return {
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name },
        init: {
          type: "MemberExpression",
          object: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "arguments" },
            property: { type: "Literal", value: 0 },
            computed: true,
            optional: false,
          },
          property: { type: "Identifier", name },
          computed: false,
          optional: false,
        },
      },
    ],
    kind: "const",
  };
}

/**
 *
 * compose runtime props to be injected into the imported react components as "runtimeProps"
 *
 */
function composeRuntimeProps(runtimeProps: ImportReactOptions["runtimeProps"]): Property {
  const propertyMap: Record<string, string> = {};

  runtimeProps?.forEach((runtimeProp) => {
    if (runtimeProp === "jsx-runtime") {
      JSXRUNTIME.forEach((j) => {
        propertyMap[j] = MAP_OF_JSXRUNTIME[j as keyof typeof MAP_OF_JSXRUNTIME];
      });
    } else if (runtimeProp === "jsx-dev-runtime") {
      JSXDEVRUNTIME.forEach((j) => {
        propertyMap[j] = MAP_OF_JSXRUNTIME[j as keyof typeof MAP_OF_JSXRUNTIME];
      });
    } else if (typeof runtimeProp === "string") {
      propertyMap[runtimeProp] = runtimeProp;
    } else {
      propertyMap[runtimeProp[0]] = runtimeProp[1];
    }
  });

  return {
    type: "Property",
    key: { type: "Identifier", name: "runtimeProps" },
    value: {
      type: "ObjectExpression",
      properties: Object.entries(propertyMap).map((property) => ({
        type: "Property",
        key: { type: "Identifier", name: property[0] },
        value: { type: "Identifier", name: property[1] },
        kind: "init",
        method: false,
        shorthand: property[0] === property[1],
        computed: false,
      })),
    },
    kind: "init",
    method: false,
    shorthand: false,
    computed: false,
  };
}

/**
 *
 * It is a recma plugin which ensures getting React from argument[0] in the compiled source;
 * and inject as property into the React components imported
 *
 * It is a work around for the issues
 * https://github.com/vercel/next.js/issues/76395
 * https://github.com/ipikuka/next-mdx-remote-client/issues/9
 *
 */
const plugin: Plugin<[ImportReactOptions?], Program> = (options) => {
  const settings = Object.assign({}, DEFAULT_SETTINGS, options) as Required<ImportReactOptions>;
  return (tree: Node) => {
    const importedComponents: string[] = [];

    // insert "const React = argument[0].React;"
    if (settings.arguments?.length) {
      visit(tree, (node, _, index, ancestors) => {
        if (index === undefined) return;

        if (node.type === "VariableDeclaration") {
          const parent = ancestors[0] as Program;

          /* istanbul ignore if */
          if ("body" in parent) {
            parent["body"].splice(
              index,
              0,
              ...settings.arguments.map(composeVariableDeclaration),
            );

            return EXIT;
          }
        }

        return CONTINUE;
      });
    }

    if (!settings.runtimeProps?.length) return;

    // finds imported React components
    visit(tree, (node, _, __, ancestors) => {
      if (node.type !== "VariableDeclaration") return CONTINUE;

      // we are looking for first-level declarations only
      if (ancestors.length > 1) return SKIP;

      let name: string | undefined;
      let value: string | number | bigint | boolean | RegExp | null | undefined;

      const variableDeclarator = node.declarations[0];
      const pattern = variableDeclarator.id;
      const expression = variableDeclarator.init;

      if (
        expression?.type === "MemberExpression" &&
        expression.property.type === "Identifier" &&
        expression.property.name === "default" &&
        expression.object.type === "AwaitExpression"
      ) {
        /* istanbul ignore if */
        if (expression.object.argument.type === "ImportExpression") {
          if (expression.object.argument.source.type === "CallExpression") {
            const argument = expression.object.argument.source.arguments[0];
            if (argument.type === "Literal") {
              value = argument.value;
            }
          }
        }
      } else if (expression?.type === "AwaitExpression") {
        /* istanbul ignore if */
        if (expression.argument.type === "ImportExpression") {
          if (expression.argument.source.type === "CallExpression") {
            const argument = expression.argument.source.arguments[0];
            if (argument.type === "Literal") {
              value = argument.value;
            }
          }
        }
      }

      /* istanbul ignore if */
      if (typeof value !== "string") {
        return CONTINUE;
      }

      // Ensure the import statement is for a relative path or absolute path
      if (
        !value.endsWith(".js") &&
        !value.endsWith(".mjs") &&
        !value.endsWith(".cjs") &&
        !value.endsWith(".jsx")
      ) {
        return CONTINUE;
      }

      /* istanbul ignore else */
      if (pattern.type === "ObjectPattern") {
        const property = pattern.properties[0];
        /* istanbul ignore if */
        if (
          property.type === "Property" &&
          property.key.type === "Identifier" &&
          property.key.name === "default" &&
          property.value.type === "Identifier"
        ) {
          name = property.value.name;
        }
      } else if (pattern.type === "Identifier") {
        name = pattern.name;
      }

      /* istanbul ignore if */
      if (!name) {
        return CONTINUE;
      }

      // if the name doesn't start with uppercase or leading underscore
      if (/^[^A-Z_].*/.test(name)) {
        return CONTINUE;
      }

      importedComponents.push(name);

      return CONTINUE;
    });

    if (importedComponents.length) {
      // adds "runtimeProps" into the imported components
      visit(tree, (node) => {
        if (node.type !== "CallExpression") return CONTINUE;

        if ("name" in node.callee) {
          if (
            node.callee.name !== "_jsx" &&
            node.callee.name !== "_jsxDEV" &&
            node.callee.name !== "_jsxs"
          ) {
            return;
          }
        }

        // A CallExpression has two arguments
        const firstArgument = node.arguments[0];
        const secondArgument = node.arguments[1];

        if (
          firstArgument.type === "Identifier" &&
          importedComponents.includes(firstArgument.name)
        ) {
          /* istanbul ignore if */
          if (secondArgument.type === "ObjectExpression") {
            secondArgument.properties.unshift(composeRuntimeProps(settings.runtimeProps));
          }
        }

        return CONTINUE;
      });
    }

    if (
      settings.runtimeProps.includes("jsx-runtime") ||
      settings.runtimeProps.includes("jsx-dev-runtime")
    ) {
      // ensures jsx runtime is available in the compiled source
      visit(tree, (node, _, __, ancestors) => {
        if (node.type !== "VariableDeclaration") return CONTINUE;

        // we are looking for first-level declarations only
        if (ancestors.length > 1) return SKIP;

        const variableDeclarator = node.declarations[0];
        const pattern = variableDeclarator.id;
        const expression = variableDeclarator.init;

        if (
          expression?.type === "MemberExpression" &&
          expression.object.type === "Identifier" &&
          expression.object.name === "arguments" &&
          expression.property.type === "Literal" &&
          expression.property.value === 0
        ) {
          /* istanbul ignore if */
          if (pattern.type === "ObjectPattern") {
            const properties = pattern.properties;
            const jsxRuntime = properties
              .filter((property) => property.type === "Property")
              .map((property) => {
                /* istanbul ignore else */
                if (property.key.type === "Identifier") {
                  return property.key.name;
                } else {
                  return undefined;
                }
              })
              .filter((property) => property !== undefined);

            const unionRuntime = [...jsxRuntime];

            if (settings.runtimeProps.includes("jsx-runtime")) {
              unionRuntime.push(...JSXRUNTIME);
            }

            if (settings.runtimeProps.includes("jsx-dev-runtime")) {
              unionRuntime.push(...JSXDEVRUNTIME);
            }

            const uniqueRuntime = [...new Set(unionRuntime)];

            const diffRuntime = uniqueRuntime.filter((x) => !jsxRuntime.includes(x));

            if (diffRuntime.length) {
              diffRuntime.forEach((name) => {
                pattern.properties.push({
                  type: "Property",
                  kind: "init",
                  shorthand: false,
                  method: false,
                  computed: false,
                  key: { type: "Identifier", name },
                  value: {
                    type: "Identifier",
                    name: MAP_OF_JSXRUNTIME[name as keyof typeof MAP_OF_JSXRUNTIME],
                  },
                });
              });
            }
          }
        }

        return CONTINUE;
      });
    }
  };
};

export default plugin;
