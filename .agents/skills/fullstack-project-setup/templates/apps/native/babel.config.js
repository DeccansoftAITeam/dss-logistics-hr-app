// NativeWind wiring — decision #15. `nativewind/babel` compiles `className`
// props to native styles; `jsxImportSource` lets babel do it at the JSX
// transform. babel-preset-expo auto-includes the react-native-reanimated
// plugin (NativeWind's peer dependency) — don't add it twice.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};