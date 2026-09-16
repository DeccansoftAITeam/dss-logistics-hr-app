/**
 * Root ESLint config. Enforces module boundaries and file-length limits.
 *
 * Add file-length or boundary exceptions ONLY in the `overrides` array below
 * — never disable these rules inline in application code.
 */
module.exports = {
  root: true,
  ignorePatterns: ["**/dist", "**/node_modules", "**/coverage", "**/.next"],
  plugins: ["boundaries"],
  settings: {
    "boundaries/elements": [
      { type: "app", pattern: "apps/*" },
      { type: "logic", pattern: "packages/core/*" },
      { type: "logic", pattern: "packages/hooks/*" },
      { type: "config", pattern: "packages/env/*" },
    ],
  },
  overrides: [
    // --- The 1000-line hard limit ---
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      rules: {
        "max-lines": [
          "error",
          { max: 1000, skipBlankLines: true, skipComments: true },
        ],
      },
    },

    // --- Line-length EXCEPTIONS ---
    {
      files: [
        "**/*.generated.ts",
        "**/generated/**",
        "**/*.d.ts",
        "packages/core/src/api-types.ts",
      ],
      rules: {
        "max-lines": "off",
      },
    },

    // --- Module boundaries: App -> logic/config, logic -> logic/config ---
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "boundaries/element-types": [
          "error",
          {
            default: "disallow",
            rules: [
              { from: "app", allow: ["logic", "config"] },
              { from: "logic", allow: ["logic", "config"] },
              { from: "config", allow: [] },
            ],
          },
        ],
      },
    },

    // --- Test runner: Vitest across all apps and packages ---
    {
      files: ["**/*.{test,spec}.{ts,tsx}"],
      globals: { vi: "readonly", describe: "readonly", it: "readonly", expect: "readonly" },
    },
  ],
};
