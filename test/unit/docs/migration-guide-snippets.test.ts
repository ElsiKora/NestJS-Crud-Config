import { readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const GUIDE_PATH: string = path.resolve("docs/guides/migrating-to-5-0/page.mdx");
const SNIPPET_DIRECTORY: string = path.resolve("docs-snippets");

/**
 * Extracts the TypeScript code blocks of an MDX page.
 * @param {string} filePath Page path.
 * @returns {Array<{ code: string, line: number }>} Each block's code and the line of its opening fence.
 */
function extractSnippets(filePath: string): Array<{ code: string; line: number }> {
 const lines: Array<string> = readFileSync(filePath, "utf8").split("\n");
 const snippets: Array<{ code: string; line: number }> = [];

 for (let index: number = 0; index < lines.length; index++) {
  if (/^```(?:ts|typescript)\b/.test(lines[index] ?? "")) {
   const start: number = index;
   const code: Array<string> = [];

   for (index++; index < lines.length && !(lines[index] ?? "").startsWith("```"); index++) {
    code.push(lines[index] ?? "");
   }

   snippets.push({ code: `${code.join("\n")}\n`, line: start + 1 });
  }
 }

 return snippets;
}

/**
 * Typechecks each snippet as its own file with the package tsconfig, resolving the package name to the sources, the
 * way an application that pastes the snippet compiles it.
 * @param {Array<{ code: string, line: number }>} snippets Snippets.
 * @returns {Map<number, Array<string>>} The diagnostics of each snippet by the line of its opening fence.
 */
function typecheckSnippets(
 snippets: Array<{ code: string; line: number }>,
): Map<number, Array<string>> {
 const configPath: string = path.resolve("tsconfig.json");
 const config: ts.ParsedCommandLine = ts.parseJsonConfigFileContent(
  ts.readConfigFile(configPath, ts.sys.readFile).config,
  ts.sys,
  path.dirname(configPath),
 );
 const files: Map<string, { code: string; line: number }> = new Map(
  snippets.map((snippet) => [path.join(SNIPPET_DIRECTORY, `line-${snippet.line}.ts`), snippet]),
 );
 const host: ts.CompilerHost = ts.createCompilerHost(config.options);
 const getSourceFile: ts.CompilerHost["getSourceFile"] = host.getSourceFile.bind(host);
 const fileExists: ts.CompilerHost["fileExists"] = host.fileExists.bind(host);

 host.fileExists = (fileName: string): boolean => files.has(fileName) || fileExists(fileName);
 host.getSourceFile = (fileName: string, languageVersion, ...rest) => {
  const snippet: { code: string; line: number } | undefined = files.get(fileName);

  return snippet
   ? ts.createSourceFile(fileName, snippet.code, languageVersion, true)
   : getSourceFile(fileName, languageVersion, ...rest);
 };

 const program: ts.Program = ts.createProgram({
  host,
  options: {
   ...config.options,
   noEmit: true,
   paths: { ...config.options.paths, "@elsikora/nestjs-crud-config": ["./src/index.ts"] },
  },
  rootNames: [...files.keys()],
 });

 return new Map(
  [...files].map(([fileName, snippet]) => {
   const sourceFile: ts.SourceFile | undefined = program.getSourceFile(fileName);
   const diagnostics: Array<ts.Diagnostic> = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
   ];

   return [
    snippet.line,
    diagnostics.map((diagnostic: ts.Diagnostic) => {
     const line: number =
      diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line ?? 0;

     return `snippet line ${line + 1}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
    }),
   ];
  }),
 );
}

describe("Migrating to 5.0 guide snippets", () => {
 const snippets: Array<{ code: string; line: number }> = extractSnippets(GUIDE_PATH);
 const diagnostics: Map<number, Array<string>> = typecheckSnippets(snippets);

 it("has TypeScript snippets", () => {
  expect(snippets.length).toBeGreaterThan(0);
 });

 it.each(snippets.map((snippet) => snippet.line))(
  "compiles the snippet at line %i as pasted",
  (line: number) => {
   expect(diagnostics.get(line)).toEqual([]);
  },
 );
});
