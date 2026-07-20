export interface SupportedLanguage {
  code: "pt-BR" | "en";
  shortLabel: string;
  nativeName: string;
}

export const supportedLanguages: SupportedLanguage[] = [
  { code: "pt-BR", shortLabel: "PT", nativeName: "Português (Brasil)" },
  { code: "en", shortLabel: "EN", nativeName: "English" },
];
