# grafana-screenshot
This project provides a simple tool to take screenshots of Grafana dashboards using Playwright with bearer token authenticatio
# Playwright Grafana Screenshot Tool

This project provides a simple tool to take screenshots of Grafana dashboards using Playwright with bearer token authentication.

## Installation

```bash
npm install
npx playwright install
```

## Usage

### Command Line

```bash
# Using npm script
npm run grafana-screenshot <grafana-url> <bearer-token> [output-path]

# Direct node execution
node grafana-screenshot.js <grafana-url> <bearer-token> [output-path]
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

- Bearer token authentication
- Automatically measures actual content dimensions from `#pageContent`
- Sets optimal viewport size to load all panels simultaneously
- Full-page screenshots with precise dimensions
- Uses Chromium with custom window size based on content measurements
- Waits for dynamic content to load (25+ seconds total)
- Error handling with detailed messages

## Getting a Grafana Bearer Token

1. Go to Grafana -> Configuration -> API Keys
2. Create a new API key with appropriate permissions
3. Copy the token and use it as the bearer token parameter

## Programmatic Usage

```javascript
const { takeGrafanaScreenshot } = require('./grafana-screenshot');

await takeGrafanaScreenshot(
  'https://grafana.example.com/d/dashboard-id',
  'your-bearer-token-here',
  'output.png'
);
```
