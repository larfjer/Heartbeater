const pkg = require("./package.json");

module.exports = pkg.babel || {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ],
};
