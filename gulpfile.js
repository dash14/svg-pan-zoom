/**
 *  Modules
 */
var gulp = require("gulp"),
  uglify = require("gulp-uglify"),
  browserify = require("browserify"),
  source = require("vinyl-source-stream"),
  rename = require("gulp-rename"),
  eslint = require("gulp-eslint"),
  gulpIf = require("gulp-if"),
  header = require("gulp-header"),
  buffer = require("vinyl-buffer"),
  pkg = require("./package.json"),
  banner =
    "// svg-pan-zoom v<%= pkg.version %>" +
    "\n" +
    "// https://github.com/ariutta/svg-pan-zoom" +
    "\n";

function isFixed(file) {
  // TODO: why is file.eslint undefined?
  return typeof file.eslint === "object" && file.eslint.fixed;
}

/**
 *  Build script
 */
function compile() {
  var bundle = browserify({ entries: "./src/stand-alone.js" }).bundle();
  var output = bundle
    .pipe(source("svg-pan-zoom.js"))
    .pipe(buffer())
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest("./dist/"))
    .pipe(rename("svg-pan-zoom.min.js"))
    .pipe(uglify())
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest("./dist/"));
  // pipe() does not forward errors, so pass bundling errors on to gulp to fail the task.
  bundle.on("error", function (err) {
    output.emit("error", err);
  });
  return output;
}

/**
 * Watch script
 */
function watch() {
  return gulp.watch("./src/**/*.js", gulp.series("compile"));
}

/**
 * Check
 */
function check() {
  return (
    gulp
      .src([
        "./**/*.js",
        "!./dist/**/*.js",
        "!./demo/**/*.js",
        "!./tests/assets/**/*.js",
        "!./src/uniwheel.js", // Ignore uniwheel
        "!./node_modules/**",
      ])
      // NOTE: this runs prettier via eslint-plugin-prettier
      .pipe(
        eslint({
          configFile: "./.eslintrc.json",
          fix: true,
        })
      )
      .pipe(eslint.format())
      .pipe(gulpIf(isFixed, gulp.dest("./")))
      // uncomment to stop on error
      .pipe(eslint.failAfterError())
  );
}

exports.compile = compile;
exports.watch = watch;
exports.check = check;

/**
 * Build
 */
exports.build = gulp.series([check, compile]);

/**
 * Default task
 */
exports.default = gulp.series([compile, watch]);
