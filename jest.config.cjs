module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/**/*..test.js"],
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
        plugins: ["babel-plugin-transform-import-meta"],
        babelrc: false,
        configFile: false,
      },
    ],
  },
};
