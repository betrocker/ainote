// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@app": "./app",
            "@components": "./components",
            "@assets": "./assets",
            "@lib": "./lib",
            "@context": "./context",
          },
        },
      ],
      [
        "react-native-reanimated/plugin",
        {
          globals: ["__checkReanimatedCall"],
          enableStrictMode: false, // ✅ DODAJ OVO
          suppressNonFatalErrors: true, // ✅ I OVO
        },
      ],
    ],
  };
};
