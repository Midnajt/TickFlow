import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for TickFlow E2E Tests
 * 
 * Based on test-plan.md and playwright-testing best practices:
 * - Chromium only (as per guidelines)
 * - Parallel execution for speed
 * - Comprehensive tracing and debugging
 * - Optimized for Next.js 15 + React 19
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Test timeout - increase for real-time tests */
  timeout: 60 * 1000, // 60 seconds per test
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only - helps with flaky tests */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI for stability */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: process.env.CI
    ? [
        // HTML reporter
        ['html', { open: 'never' }],
        // List reporter for CI
        ['list'],
        // JSON reporter for CI integration
        ['json', { outputFile: 'playwright-report/results.json' }],
      ]
    : [
        // HTML reporter for local development
        ['html', { open: 'never' }],
        // List reporter
        ['list'],
      ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording on failure */
    video: 'retain-on-failure',
    
    /* Action timeout */
    actionTimeout: 15 * 1000, // 15 seconds for actions
    
    /* Navigation timeout */
    navigationTimeout: 30 * 1000, // 30 seconds for navigation
    
    /* Emulate viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors in development */
    ignoreHTTPSErrors: true,
    
    /* Locale and timezone */
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    
    /* Ensure cookies persist across navigations */
    storageState: undefined, // Don't load storage state at start
    
    /* Accept downloads and handle cookies properly */
    acceptDownloads: true,
    
    /* Add extra HTTP headers to ensure cookie acceptance */
    extraHTTPHeaders: {
      'Accept': 'application/json, text/plain, */*',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable better error handling
        launchOptions: {
          args: [
            '--disable-dev-shm-usage', // Overcome limited resource problems in CI
            '--no-sandbox', // Required for CI environments
          ],
        },
      },
    },
    
    // Uncomment to test on Firefox (optional)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    
    // Uncomment to test on mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start server
    stdout: 'pipe', // Show server logs for debugging (was 'ignore')
    stderr: 'pipe', // Show server errors
    env: {
      // Disable Fast Refresh during E2E tests to prevent request interruptions
      NEXT_PRIVATE_DISABLE_FAST_REFRESH: '1',
    },
  },
  
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
  
  /* Global setup/teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'), // Optional
})

