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

  await page.evaluate(() => {
    const panel = document.querySelector(".hero-panel");

    if (panel) {
      panel.style.margin = "0";
      panel.style.padding = "24px";
      panel.style.height = "auto";
      panel.style.minHeight = "0";
      panel.style.maxHeight = "300px";
      panel.style.overflow = "hidden";
    }

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.minHeight = "0";
    document.body.style.height = "auto";

    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.minHeight = "0";
    document.documentElement.style.height = "auto";
  });

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
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1400"
  height="300"
  viewBox="0 0 1400 300"
>
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">
      <style>
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent;
        }

        ${css}
      </style>

      ${el.outerHTML}
    </div>
  </foreignObject>
</svg>`;
  });

  fs.mkdirSync("svgs", { recursive: true });

  fs.writeFileSync(
    "svgs/github-status-card.svg",
    svg
  );

  await browser.close();

  console.log("Generated github-status-card.svg");
})();
