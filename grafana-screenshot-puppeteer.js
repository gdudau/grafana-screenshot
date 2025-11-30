const puppeteer = require('puppeteer');

async function scrollToLoadAllContentPuppeteer(page) {
  console.log('Starting progressive scroll to load all Grafana panels (puppeteer)...');

  let previousHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrollCount = 0;
  const maxScrolls = 20;

  while (scrollCount < maxScrolls) {
    await page.evaluate(() => { window.scrollBy(0, window.innerHeight * 0.8); });
    await page.waitForTimeout(2000);

    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`Scroll ${scrollCount + 1}: Height changed from ${previousHeight} to ${currentHeight}`);

    if (currentHeight === previousHeight) {
      await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
      await page.waitForTimeout(2000);
      const finalHeight = await page.evaluate(() => document.body.scrollHeight);
      if (finalHeight === currentHeight) {
        console.log('No more content loaded, stopping scroll');
        break;
      }
      previousHeight = finalHeight;
    } else {
      previousHeight = currentHeight;
    }

    scrollCount++;
  }

  await page.evaluate(() => { window.scrollTo(0, 0); });
  await page.waitForTimeout(1000);
  console.log('Finished scrolling, all panels should be loaded (puppeteer)');
}

async function takeGrafanaScreenshotPuppeteer(url, token, outputPath = 'grafana-screenshot-puppeteer.png') {
  if (!token) token = 'glsa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  if (!url) url = 'https://grafana.example.com/d/dashboard-id?kiosk=true';

  console.log('Measuring content dimensions (puppeteer)...');
  const tempBrowser = await puppeteer.launch();
  const tempPage = await tempBrowser.newPage();

  let contentDimensions = { width: 1920, height: 2000 };

  try {
    await tempPage.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });
    await tempPage.goto(url, { waitUntil: 'networkidle2' });
    await tempPage.waitForTimeout(5000);

    contentDimensions = await tempPage.evaluate(() => {
      const pageContent = document.querySelector('main.css-1d1v5u1-page-container#pageContent');
      if (pageContent) {
        const rect = pageContent.getBoundingClientRect();
        return { width: Math.ceil(rect.width), height: Math.ceil(rect.height) };
      }
      return { width: 1920, height: 2000 };
    });

    console.log(`Content dimensions: ${contentDimensions.width}x${contentDimensions.height}`);
  } finally {
    await tempBrowser.close();
  }

  // Launch browser with measured window size
  const windowWidth = contentDimensions.width;
  const windowHeight = contentDimensions.height + 200; // padding

  const browser = await puppeteer.launch({
    args: [`--window-size=${windowWidth},${windowHeight}`]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: windowWidth, height: windowHeight });

  try {
    await page.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });
    console.log(`Navigating to: ${url} (puppeteer)`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Waiting for all panels to load in measured viewport (puppeteer)...');
    await page.waitForTimeout(15000);

    // Force lazy panels visible and trigger lazy loading
    await page.evaluate(() => {
      const panels = document.querySelectorAll('[data-panelid]');
      panels.forEach(panel => {
        panel.style.display = 'block';
        panel.style.visibility = 'visible';
      });
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
    });

    // Progressive scroll to ensure lazy-loaded content appears
    await scrollToLoadAllContentPuppeteer(page);
    await page.waitForTimeout(5000);

    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`Screenshot saved to: ${outputPath}`);
    console.log(`Page title: ${await page.title()}`);

  } catch (err) {
    console.error('Error taking screenshot (puppeteer):', err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node grafana-screenshot-puppeteer.js <grafana-url> <bearer-token> [output-path]');
    process.exit(1);
  }
  const [url, token, outputPath] = args;
  takeGrafanaScreenshotPuppeteer(url, token, outputPath)
    .then(() => console.log('Puppeteer screenshot completed successfully'))
    .catch(err => {
      console.error('Failed to take puppeteer screenshot:', err);
      process.exit(1);
    });
}

module.exports = { takeGrafanaScreenshotPuppeteer };