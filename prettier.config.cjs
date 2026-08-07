/**
 * Para utilizar está configuração, efetue a instalação dos plugins necessários:
 * pnpm add -Dw prettier @ianvs/prettier-plugin-sort-imports prettier-plugin-tailwindcss
 */

module.exports = {
  semi: true, // Adiciona ponto e vírgula no final das linhas
  singleQuote: false, // Usa aspas duplas para strings
  jsxSingleQuote: false, // Usa aspas duplas em JSX
  tabWidth: 2, // Número de espaços para indentação
  trailingComma: "es5", // Adiciona vírgula final quando possível
  printWidth: 80, // Largura máxima da linha antes de quebrar
  bracketSpacing: true, // Adiciona espaços dentro de { }
  endOfLine: "lf", // Consistência entre OS (Windows/Mac/Linux)

  // Configuração de Plugins
  plugins: [
    "@ianvs/prettier-plugin-sort-imports", // Plugin para ordenação de imports
    "prettier-plugin-tailwindcss", // Plugin para ordenação de classes do TailwindCSS (sempre por último)
  ],

  // Configuração de Import Sorting (sintaxe mais moderna)
  importOrder: [
    "", // Linha vazia no início (para comentários de topo)
    "<BUILTIN_MODULES>", // Node.js built-ins
    "<THIRD_PARTY_MODULES>", // External packages
    "", // Linha vazia
    "^@/(.*)$", // Internal packages (@/ paths)
    "^~/(.*)$", // Alternativa para projetos que usam ~/
    "", // Linha vazia
    "^[.]", // Relative imports
  ],

  // Configuração TailwindCSS
  tailwindStylesheet: "./apps/web/src/styles/globals.css", // Caminho para o CSS principal do Tailwind v4
  tailwindFunctions: ["clsx", "cn", "tw", "cva"], // Funções que usam classes do Tailwind
  tailwindAttributes: ["className", "class", "tw"], // Atributos que usam classes do Tailwind
};
