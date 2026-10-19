// Runs the QUnit page in tests/index.html in headless Chromium and fails when any test fails.
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
// Pages are served from a made-up origin, since blanket.js loads scripts with XHR, which file:// blocks.
const origin = "http://svg-pan-zoom.test";
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route(`${origin}/**`, async (route) => {
    const path = normalize(
      decodeURIComponent(new URL(route.request().url()).pathname)
    );
    try {
      await route.fulfill({
        body: await readFile(join(root, path)),
        contentType: contentTypes[extname(path)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });
  page.on("pageerror", (error) => console.error(error));

  await page.goto(`${origin}/tests/index.html`);
  await page.waitForFunction(() =>
    /completed/.test(
      document.getElementById("qunit-testresult")?.textContent ?? ""
    )
  );

  const result = await page.evaluate(() => {
    const count = (selector) =>
      Number(
        document.querySelector(`#qunit-testresult ${selector}`).textContent
      );
    return {
      summary: document.getElementById("qunit-testresult").textContent,
      failed: count(".failed"),
      total: count(".total"),
      failures: [...document.querySelectorAll("#qunit-tests > li.fail")].map(
        (li) => li.innerText
      ),
    };
  });
  console.log(result.summary);
  for (const failure of result.failures) console.error(`\n${failure}`);
  if (result.failed > 0 || result.total === 0) process.exitCode = 1;
} finally {
  await browser.close();
}
