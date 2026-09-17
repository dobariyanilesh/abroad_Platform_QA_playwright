# Abroad Platform QA — Playwright

End-to-end test automation for the Abroad Platform admin console (`rc-admin.abroad.io`) and client platform (`rc.abroad.io`), built with [Playwright](https://playwright.dev/).

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later (includes `npm`)
- Git

Check your versions:

```bash
node -v
npm -v
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dobariyanilesh/abroad_Platform_QA_playwright.git
   cd abroad_Platform_QA_playwright
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install the Playwright browser binaries (Chromium, Firefox, WebKit):

   ```bash
   npx playwright install
   ```

   To install only Chromium (faster, matches the default project config):

   ```bash
   npx playwright install chromium
   ```

## Project Structure

```
.
├── tests/                  # Playwright test specs
│   └── login.spec.ts
├── playwright.config.ts    # Playwright configuration (baseURL, projects, reporters)
├── package.json
└── README.md
```

## Running Tests

Run the full suite headless:

```bash
npm test
```

Run headed (visible browser):

```bash
npm run test:headed
```

Run with the interactive UI mode (recommended while writing/debugging tests):

```bash
npm run test:ui
```

Step through a test with the Playwright inspector:

```bash
npm run test:debug
```

View the last HTML report:

```bash
npm run report
```

## Using Codegen to Record New Tests

Playwright's [codegen](https://playwright.dev/docs/codegen) tool records your clicks/inputs in a real browser and generates test code automatically — the fastest way to bootstrap a new spec.

Start codegen against the admin platform (pre-wired as an npm script):

```bash
npm run codegen
```

This is equivalent to:

```bash
npx playwright codegen https://rc-admin.abroad.io
```

Other useful codegen invocations:

```bash
# Record against the client platform instead
npx playwright codegen https://rc.abroad.io

# Save the generated script directly to a file
npx playwright codegen --output tests/new-flow.spec.ts https://rc-admin.abroad.io

# Emulate a specific device/viewport while recording
npx playwright codegen --device="iPhone 13" https://rc.abroad.io
```

Workflow:

1. Run the `codegen` command above — a browser window and the Playwright Inspector will open side by side.
2. Interact with the app in the opened browser (navigate, click, fill forms, etc.).
3. Watch the Inspector generate Playwright code in real time.
4. Copy the generated code into a new file under `tests/`, or use `--output` to save it directly.
5. Clean up selectors/assertions as needed, then run it with `npm test`.

## Configuration

Key settings live in `playwright.config.ts`:

- `baseURL`: defaults to `https://rc-admin.abroad.io` so tests can use relative paths (`page.goto('/')`).
- `trace: 'on-first-retry'`: captures a trace for debugging flaky tests.
- `screenshot: 'only-on-failure'`: saves a screenshot when a test fails.
- `projects`: currently configured for Chromium only; add entries for `firefox` / `webkit` as needed.

## Notes

- Test credentials/2FA codes for the staging environment are managed separately and should **not** be committed to this repository. Use environment variables (`.env`, already git-ignored) or a secrets manager for any sensitive values referenced in tests.
- `test-results/`, `playwright-report/`, and screenshots are git-ignored — they are generated artifacts, not source.
