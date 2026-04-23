const { src, dest } = require('gulp');

/**
 * n8n's node loader resolves icon paths relative to the compiled `dist/` file.
 * TypeScript compiles `.ts` but ignores assets, so we copy the SVG / PNG
 * icons from `nodes/` and `credentials/` into the matching `dist/` paths.
 */
function buildIcons() {
  return src(['nodes/**/*.{png,svg}', 'credentials/**/*.{png,svg}'], {
    base: '.',
  }).pipe(dest('dist/'));
}

exports['build:icons'] = buildIcons;
