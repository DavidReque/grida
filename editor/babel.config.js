module.exports = {
  presets: ["next/babel", "@emotion/babel-preset-css-prop"],
  plugins: [
    ["@emotion"],
    [
      "module-resolver",
      {
        root: ["."],
        alias: {
          components: "./components",
          icons: "./icons",
          layouts: "./layouts",
          utils: "./utils",
          public: "./public",
          hooks: "./hooks",
        },
      },
    ],
  ],
};
