import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactNative from "eslint-plugin-react-native";
import importPlugin from "eslint-plugin-import";
import typescriptParser from "@typescript-eslint/parser";

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    react.configs.flat.recommended,
    {
        ignores: ["node_modules", "dist", "build"],
        languageOptions: {
            parser: typescriptParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: {
            react,
            "react-native": reactNative,
            import: importPlugin,
        },
        settings: {
            "import/resolver": {
                typescript: {
                    project: "./tsconfig.json",
                },
                node: {
                    paths: ["."],
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                },
            },
        },
        rules: {
            "react/react-in-jsx-scope": "off", // jer koristimo Expo/React 18+
        },
    },
];
