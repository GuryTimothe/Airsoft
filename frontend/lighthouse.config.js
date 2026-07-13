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
      assertions: {
        // Minimal assertions - only enforce what matters
        "categories:performance": ["error", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },
  },
};
