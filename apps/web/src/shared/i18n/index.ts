import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import accountEn from "@/features/account/i18n/en.json";
import accountPtBR from "@/features/account/i18n/pt-BR.json";
import authEn from "@/features/auth/i18n/en.json";
import authPtBR from "@/features/auth/i18n/pt-BR.json";
import calendarEn from "@/features/calendar/i18n/en.json";
import calendarPtBR from "@/features/calendar/i18n/pt-BR.json";
import channelsEn from "@/features/channels/i18n/en.json";
import channelsPtBR from "@/features/channels/i18n/pt-BR.json";
import postsEn from "@/features/posts/i18n/en.json";
import postsPtBR from "@/features/posts/i18n/pt-BR.json";
import subscriptionEn from "@/features/subscription/i18n/en.json";
import subscriptionPtBR from "@/features/subscription/i18n/pt-BR.json";
import tagsEn from "@/features/tags/i18n/en.json";
import tagsPtBR from "@/features/tags/i18n/pt-BR.json";
import workspacesEn from "@/features/workspaces/i18n/en.json";
import workspacesPtBR from "@/features/workspaces/i18n/pt-BR.json";

import commonEn from "./locales/en/common.json";
import dashboardEn from "./locales/en/dashboard.json";
import navigationEn from "./locales/en/navigation.json";
import commonPtBR from "./locales/pt-BR/common.json";
import dashboardPtBR from "./locales/pt-BR/dashboard.json";
import navigationPtBR from "./locales/pt-BR/navigation.json";

const savedLanguage = window.localStorage.getItem("postmade.language");
const browserLanguage = navigator.language.toLowerCase().startsWith("pt")
  ? "pt-BR"
  : "en";

export const resources = {
  en: {
    common: commonEn,
    navigation: navigationEn,
    account: accountEn,
    dashboard: dashboardEn,
    auth: authEn,
    posts: postsEn,
    subscription: subscriptionEn,
    workspaces: workspacesEn,
    channels: channelsEn,
    calendar: calendarEn,
    tags: tagsEn,
  },
  "pt-BR": {
    common: commonPtBR,
    navigation: navigationPtBR,
    account: accountPtBR,
    dashboard: dashboardPtBR,
    auth: authPtBR,
    posts: postsPtBR,
    subscription: subscriptionPtBR,
    workspaces: workspacesPtBR,
    channels: channelsPtBR,
    calendar: calendarPtBR,
    tags: tagsPtBR,
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage ?? browserLanguage,
  fallbackLng: "en",
  supportedLngs: ["en", "pt-BR"],
  defaultNS: "common",
  ns: [
    "common",
    "navigation",
    "account",
    "dashboard",
    "auth",
    "posts",
    "channels",
    "calendar",
    "tags",
    "subscription",
    "workspaces",
  ],
  showSupportNotice: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
