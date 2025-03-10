import type { Plugin } from "unified";
import type { Node, Program, Property, VariableDeclaration } from "estree";
import { CONTINUE, EXIT, SKIP, visit } from "estree-util-visit";

export type ImportReactOptions = {
  argumentsToBeAdded?: string[];
  propertiesToBeInjected?: [string, string][]; // array of [key, value] tuples
};

const DEFAULT_SETTINGS: ImportReactOptions = {
  argumentsToBeAdded: ["React"],
  propertiesToBeInjected: [["React", "React"]],
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
 * compose property to be injected into the react components imported
 *
 */
function composeProperty(keyvalue: [string, string]): Property {
  return {
    type: "Property",
    key: { type: "Identifier", name: keyvalue[0] },
    value: { type: "Identifier", name: keyvalue[1] },
    kind: "init",
    method: false,
    shorthand: keyvalue[0] === keyvalue[1],
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
    if (settings.argumentsToBeAdded?.length) {
      visit(tree, (node, _, index, ancestors) => {
        if (index === undefined) return;

        if (node.type === "VariableDeclaration") {
          const parent = ancestors[0] as Program;

          if ("body" in parent) {
            parent["body"].splice(
              index,
              0,
              ...settings.argumentsToBeAdded.map(composeVariableDeclaration),
            );

            return EXIT;
          }
        }

        return CONTINUE;
      });
    }

    if (!settings.propertiesToBeInjected?.length) return;

    // finds imported React components
    visit(tree, (node, _, index, ancestors) => {
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
        if (expression.object.argument.type === "ImportExpression") {
          if (expression.object.argument.source.type === "CallExpression") {
            const argument = expression.object.argument.source.arguments[0];
            if (argument.type === "Literal") {
              value = argument.value;
            }
          }
        }
      } else if (expression?.type === "AwaitExpression") {
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

      if (pattern.type === "ObjectPattern") {
        const property = pattern.properties[0];
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
      // adds { React } property into the imported components
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
          if (secondArgument.type === "ObjectExpression") {
            secondArgument.properties.unshift(
              ...settings.propertiesToBeInjected.map(composeProperty),
            );
          }
        }

        return CONTINUE;
      });
    }
  };
};

export default plugin;
