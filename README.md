# Grafana Screenshot Tools

This repository contains small utilities to take screenshots of Grafana dashboards using browser automation. There are two variants:

- `grafana-screenshot.js` — Playwright-based implementation
- `grafana-screenshot-puppeteer.js` — Puppeteer-based implementation

Both scripts support bearer-token authentication and are intended to produce a single full-page PNG screenshot of a Grafana dashboard.

## Installation

Install dependencies for the approach you want to use.

Playwright (default):

```bash
npm install
npx playwright install
```

Puppeteer (optional):

```bash
npm install puppeteer
```

## Usage

### Command Line

```bash
# Playwright (npm script)
npm run grafana-screenshot <grafana-url> <bearer-token> [output-path]

# Playwright (direct)
node grafana-screenshot.js <grafana-url> <bearer-token> [output-path]

# Puppeteer (npm script)
npm run grafana-screenshot-puppeteer <grafana-url> <bearer-token> [output-path]

# Puppeteer (direct)
node grafana-screenshot-puppeteer.js <grafana-url> <bearer-token> [output-path]
```

### Example

```bash
npm run grafana-screenshot https://grafana.example.com/d/abc123/my-dashboard eyJrIjoiYWJjZGVmZ2hpamsiLCJuIjoidGVzdCIsImlkIjoxfQ== dashboard-screenshot.png
```

### Parameters

- `grafana-url`: Full URL to the Grafana dashboard or page
- `bearer-token`: Grafana API token for authentication
- `output-path`: Optional output file path (default: `grafana-screenshot.png`)

## Features

- Bearer token authentication (Authorization: Bearer <token>)
- Automatically measures actual content dimensions from the page container element (`main.css-1d1v5u1-page-container#pageContent`) when present
- Sets an optimal viewport/window-size to force Grafana to render all panels at once (avoids panels that render only when visible)
- Full-page PNG screenshots only (HTML snapshot saving was removed)
- Works with both Playwright and Puppeteer variants (see files above)
- Conservative default waits and progressive scrolling are used to ensure lazy-loaded panels render (total wait ~20–30s depending on dashboard complexity)
- Basic error handling and informative console logs

## Getting a Grafana Bearer Token

1. Go to Grafana → Configuration → API Keys
2. Create a new API key with appropriate permissions
3. Copy the token and use it as the bearer token parameter

## Programmatic Usage

```javascript
// Playwright variant
const { takeGrafanaScreenshot } = require('./grafana-screenshot');
await takeGrafanaScreenshot('https://grafana.example.com/d/dashboard-id', 'your-bearer-token', 'output.png');

// Puppeteer variant
const { takeGrafanaScreenshotPuppeteer } = require('./grafana-screenshot-puppeteer');
await takeGrafanaScreenshotPuppeteer('https://grafana.example.com/d/dashboard-id', 'your-bearer-token', 'output-puppeteer.png');
```
