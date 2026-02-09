export default [
    {
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            parser: (await import("@typescript-eslint/parser")).default,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default,
            "react": (await import("eslint-plugin-react")).default,
            "react-hooks": (await import("eslint-plugin-react-hooks")).default,
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/no-explicit-any": "warn",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];
