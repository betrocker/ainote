/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "ios-bg": "#F2F2F7",
        "iosd-bg": "#1C1C1E",
        "ios-surface": "#FFFFFF",
        "iosd-surface": "#2C2C2E",
        "ios-label": "#000000",
        "iosd-label": "#FFFFFF",
        "ios-label2": "#3C3C4399",
        "iosd-label2": "#EBEBF599",
        "ios-sep": "#3C3C434A",
        "iosd-sep": "#54545899",
        "ios-blue": "#0088FF",
        "iosd-blue": "#0091FF",
      },
      fontFamily: {
        mona: ["MonaSans-Regular"],
        monaBold: ["MonaSans-Bold"],
        monaBlack: ["MonaSans-Black"],
      },
    },
  },

  plugins: [],
};
