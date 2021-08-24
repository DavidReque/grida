const path = require("path");
const withPlugins = require("next-compose-plugins");
const withImages = require("next-images");
const withTM = require("next-transpile-modules")(
  [
    "@app/scene-view",
    "@design-sdk/figma-remote",
    "@design-sdk/figma-types",
    //
  ],
  {
    // resolveSymlinks: true,
    debug: process.env === "development",
  }
);

const FIREBASE_ENV_VARS = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUKET: process.env.FIREBASE_STORAGE_BUKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
};

const LOCAL_DEVELOPMENT_ENV_VARS = {
  FIGMA_PERSONAL_ACCESS_TOKEN: process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
};

module.exports = withPlugins([withTM, withImages], {
  webpack: function (config, { isServer }) {
    config.module.rules.push({
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)$/,
      use: {
        loader: "url-loader",
        options: {
          limit: 100000,
          name: "[name].[ext]",
        },
      },
    });
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });
    config.module.rules.push({
      test: /\.ts(x?)$/,
      use: "babel-loader",
    });

    //  https://www.npmjs.com/package/next-transpile-modules#i-have-trouble-with-duplicated-dependencies-or-the-invalid-hook-call-error-in-react
    if (isServer) {
      console.log("server app");
      config.externals = ["react", ...config.externals];
    }
    const reactPath = path.resolve(__dirname, "..", "node_modules", "react");
    console.log("reactPath", reactPath);
    config.resolve.alias["react"] = reactPath;
    //

    if (!isServer) {
      config.node = {
        fs: "empty",
      };
    }

    return config;
  },
  env: {
    ...FIREBASE_ENV_VARS,
    ...LOCAL_DEVELOPMENT_ENV_VARS,
    NEXT_PUBLIC_SCENES_STORE_TOKEN: process.env.NEXT_PUBLIC_SCENES_STORE_TOKEN,
  },

  // enable SPA mode, disable SSR
  target: "serverless",
  async rewrites() {
    return [
      // Rewrite everything to `pages/index`
      // {
      //   source: "/:any*",
      //   destination: "/",
      // },
    ];
  },
});
