const { chromium } = require('playwright');

async function scrollToLoadAllContent(page) {
  console.log('Starting progressive scroll to load all Grafana panels...');

  // Get initial scroll height
  let previousHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrollCount = 0;
  const maxScrolls = 20; // Maximum scroll attempts

  while (scrollCount < maxScrolls) {
    // Scroll down by viewport height
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 0.8); // Scroll 80% of viewport height
    });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check if page height increased
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);

    console.log(`Scroll ${scrollCount + 1}: Height changed from ${previousHeight} to ${currentHeight}`);

    if (currentHeight === previousHeight) {
      // Try scrolling to absolute bottom one more time
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
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

  // Scroll back to top for final operations
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  await page.waitForTimeout(1000);
  console.log('Finished scrolling, all panels should be loaded');
}

async function takeGrafanaScreenshot(url, token, outputPath = 'grafana-screenshot.png') {
  if(!token) token = "glsa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // Placeholder token
  if(!url) url = "https://grafana.example.com/d/dashboard-id?kiosk=true";

  // First, get the actual content dimensions
  console.log('Measuring content dimensions...');
  const tempBrowser = await chromium.launch();
  const tempContext = await tempBrowser.newContext();
  const tempPage = await tempContext.newPage();

  let contentDimensions = { width: 1920, height: 2000 }; // fallback

  try {
    // Set auth for temp page
    await tempPage.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`
    });

    await tempPage.goto(url, { waitUntil: 'networkidle' });
    await tempPage.waitForTimeout(5000);

    // Get the actual content dimensions from the page container
    contentDimensions = await tempPage.evaluate(() => {
      const pageContent = document.querySelector('main.css-1d1v5u1-page-container#pageContent');
      if (pageContent) {
        const rect = pageContent.getBoundingClientRect();
        return {
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height)
        };
      }
      // Fallback if element not found
      return {
        width: 1920,
        height: 2000
      };
    });

    console.log(`Content dimensions: ${contentDimensions.width}x${contentDimensions.height}`);
  } finally {
    await tempBrowser.close();
  }

  // Now launch browser with proper viewport
  const browser = await chromium.launch({
    args: [`--window-size=${contentDimensions.width},${contentDimensions.height + 200}`] // Add some padding
  });
  const context = await browser.newContext({
    viewport: {
      width: contentDimensions.width,
      height: contentDimensions.height + 200
    }
  });
  const page = await context.newPage();

  try {
    // Set the authorization header for bearer token
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for initial load with proper viewport
    console.log('Waiting for all panels to load in measured viewport...');
    await page.waitForTimeout(15000);

    // Try to force loading of all panels by temporarily making them all visible
    await page.evaluate(() => {
      // Force all lazy-loaded panels to be visible
      const panels = document.querySelectorAll('[data-panelid]');
      panels.forEach(panel => {
        panel.style.display = 'block';
        panel.style.visibility = 'visible';
      });

      // Trigger any lazy loading
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
    });

    // Additional wait for panels to render
    await page.waitForTimeout(10000);

    // Take screenshot
    await page.screenshot({ path: outputPath, fullPage: true });

    console.log(`Screenshot saved to: ${outputPath}`);
    console.log(`Page title: ${await page.title()}`);

  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node grafana-screenshot.js <grafana-url> <bearer-token> [output-path]');
    console.log('Example: node grafana-screenshot.js https://grafana.example.com/d/dashboard-id eyJrIjoiYWJjIiwi... screenshot.png');
    process.exit(1);
  }

  const [url, token, outputPath] = args;
  takeGrafanaScreenshot(url, token, outputPath)
    .then(() => console.log('Screenshot completed successfully'))
    .catch(error => {
      console.error('Failed to take screenshot:', error);
      process.exit(1);
    });
}

module.exports = { takeGrafanaScreenshot };