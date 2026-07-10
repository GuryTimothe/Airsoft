/**
 * Lighthouse CI Configuration with Performance Budget
 * Defines thresholds for Performance, Accessibility, Best Practices, SEO
 */

module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000"],
      numberOfRuns: 3,
      headless: true,
      settings: {
        chromeFlags: ["--no-sandbox", "--disable-dev-shm-usage"],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        // Performance budget: > 80
        "categories:performance": ["error", { minScore: 0.8 }],

        // Accessibility: > 90 (WCAG Level AA compliance)
        "categories:accessibility": ["error", { minScore: 0.9 }],

        // Best Practices: > 85
        "categories:best-practices": ["error", { minScore: 0.85 }],

        // SEO: > 80
        "categories:seo": ["error", { minScore: 0.8 }],

        // Specific audit thresholds
        "first-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // No accessibility violations
        "no-unoptimized-images": ["warn", { maxNumericValue: 2 }],
        "no-document-write": ["error"],
        "no-console-time": ["warn"],

        // Security headers
        "is-crawlable": ["error"],
        "robots-txt": ["warn"],
      },
    },
  },
};
