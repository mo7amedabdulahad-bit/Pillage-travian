const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/game/s-129b/v-1/village');

  // Wait a few seconds for data to load and ResizeObserver to calculate scale
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'village-layout-manual-check.png' });

  await browser.close();
})();
