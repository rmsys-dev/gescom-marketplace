import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const FEATURES = [
  "addresses",
  "authentication",
  "enterprise",
  "home",
  "memberships",
  "modules",
  "notifications",
  "products",
  "sales",
  "stock",
  "support",
  "type-networks",
  "type-supplier-customers",
  "user-onboarding",
  "user-profile",
  "users",
];

const LIB_BAN = {
  group: ["@/lib", "@/lib/*", "@/lib/**"],
  message: "Use @/shared/lib em vez do alias removido @/lib.",
};

function featureImportOverrides() {
  return FEATURES.map((feature) => {
    const others = FEATURES.filter((name) => name !== feature);
    return {
      files: [`src/features/${feature}/**/*.{js,jsx,mjs,ts,tsx}`],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              LIB_BAN,
              ...others.flatMap((other) => [
                {
                  group: [`@/features/${other}/*`, `@/features/${other}/*/**`],
                  message: `Importe @/features/${other} (barrel público), não o interior da feature.`,
                },
              ]),
            ],
          },
        ],
      },
    };
  });
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [LIB_BAN],
        },
      ],
      "import/no-deprecated": "error",
    },
  },
  ...featureImportOverrides(),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
