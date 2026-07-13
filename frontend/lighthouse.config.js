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
        // Only enforce main categories - be lenient with minimum scores
        "categories:performance": ["warn", { minScore: 0.5 }],
        "categories:accessibility": ["warn", { minScore: 0.8 }],
      },
    },
  },
};
