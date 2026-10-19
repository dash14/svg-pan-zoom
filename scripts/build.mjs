// Bundles src/ into dist/svg-pan-zoom.js and dist/svg-pan-zoom.min.js. Pass --watch to rebuild on change.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const banner = `// svg-pan-zoom v${pkg.version}\n// https://github.com/ariutta/svg-pan-zoom`;

const options = {
  absWorkingDir: fileURLToPath(new URL("..", import.meta.url)),
  entryPoints: ["src/stand-alone.js"],
  bundle: true,
  format: "iife",
  target: "es5",
  banner: { js: banner },
  logLevel: "info",
};
const builds = [
  { ...options, outfile: "dist/svg-pan-zoom.js" },
  { ...options, outfile: "dist/svg-pan-zoom.min.js", minify: true },
];

if (process.argv.includes("--watch")) {
  for (const build of builds) await (await esbuild.context(build)).watch();
} else {
  // esbuild has already logged the errors, so only the exit code is left to set.
  await Promise.all(builds.map((build) => esbuild.build(build))).catch(() => {
    process.exitCode = 1;
  });
}
