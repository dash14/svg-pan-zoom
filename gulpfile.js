/**
 *  Modules
 */
var gulp = require("gulp"),
  eslint = require("gulp-eslint"),
  gulpIf = require("gulp-if");

function isFixed(file) {
  // TODO: why is file.eslint undefined?
  return typeof file.eslint === "object" && file.eslint.fixed;
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

exports.check = check;
