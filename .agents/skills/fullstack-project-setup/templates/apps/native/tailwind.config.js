/** @type {import('tailwindcss').Config} */
// NativeWind styling config — decision #15. Built on nativewind/preset;
// scan only this app's own UI files. Shared packages contain no styling
// (decision #15) so they're deliberately not in `content`.
module.exports = {
  content: ["./App.tsx", "./screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};