import { afterAll, describe, expect, it } from "vitest";
import i18n from "../index";

const initialLanguage = i18n.resolvedLanguage ?? "en";

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage);
});

describe("i18n namespaces", () => {
  it("resolves shared and feature translations independently", async () => {
    await i18n.changeLanguage("pt-BR");

    expect(i18n.t("posts", { ns: "navigation" })).toBe("Publicações");
    expect(i18n.t("loginTitle", { ns: "auth" })).toBe("Bem-vindo de volta");
    expect(i18n.t("comingSoonDescription", { ns: "calendar" })).toContain("agendamentos");
  });
});
