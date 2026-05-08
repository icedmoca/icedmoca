const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage({
    viewport: {
      width: 1600,
      height: 900
    }
  });

  await page.goto("https://mrshu.github.io/github-statuses/", {
    waitUntil: "networkidle"
  });

  await page.waitForSelector(".hero-panel");

  const svg = await page.$eval(".hero-panel", el => {
    const css = [...document.styleSheets]
      .map(sheet => {
        try {
          return [...sheet.cssRules]
            .map(rule => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="500">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">
      <style>${css}</style>
      ${el.outerHTML}
    </div>
  </foreignObject>
</svg>`;
  });

  fs.writeFileSync("github-status-card.svg", svg);

  await browser.close();
})();
