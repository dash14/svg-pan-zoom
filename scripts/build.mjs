// Bundles src/ into the ES module dist/svg-pan-zoom.js. Pass --watch to rebuild on change.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const banner = `// svg-pan-zoom v${pkg.version}\n// https://github.com/dash14/svg-pan-zoom`;

const options = {
  absWorkingDir: fileURLToPath(new URL("..", import.meta.url)),
  entryPoints: ["src/svg-pan-zoom.js"],
  outfile: "dist/svg-pan-zoom.js",
  bundle: true,
  format: "esm",
  target: "es2015",
  banner: { js: banner },
  logLevel: "info",
};
if (process.argv.includes("--watch")) {
  await (await esbuild.context(options)).watch();
} else {
  await esbuild.build(options).catch((error) => {
    // esbuild logs build errors itself; anything else would go unreported.
    if (!error.errors) console.error(error);
    process.exitCode = 1;
  });
}
