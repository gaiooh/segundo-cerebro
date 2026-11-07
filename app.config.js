// Extends app.json (https://docs.expo.dev/workflow/configuration/).
//
// EXPO_BASE_URL serves the web build from a sub-path, e.g. GitHub Pages at
// https://gaiooh.github.io/segundo-cerebro (set in .github/workflows/deploy-pages.yml).
// Local development keeps serving from the root.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
