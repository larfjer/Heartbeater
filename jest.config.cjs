module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/**/*..test.js"],
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
        babelrc: false,
        configFile: false,
      },
    ],
  },
};
