// NativeWind wiring — decision #15. withNativeWind teaches Metro to compile
// ./global.css (the entry stylesheet) and feed class names to the app.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });