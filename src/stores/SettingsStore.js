// stores/settingsStore.js
import { defineStore } from "pinia";
import { settingsGetters } from "./settingsGetters";
import { settingsActions } from "./settingsActions";

export const useSettingsStore = defineStore("settingsStore", {
  state: () => ({
    apiProfile: "standard",
    appVersion: null,
    brandTitle: "",
    currentPath: null,
    currentStudy: "",
    followingHimSegment: "1-0-0",
    jVideoSegments: { segments: [], currentId: 1 },
    textLanguageObjectSelected: null,
    languageSelectorMode: null,
    languages: [],
    languagesUsed: [],
    lessonNumber: { ctc: 1, lead: 1, life: 1, jvideo: 1 },
    maxLessons: {},
    menu: [],
    menuError: null,
    menuStatus: "idle",
    previousPage: "/index",
    seasonalContent: null,
    seasonalExpires: null,
    variantByStudy: {},
    videoLanguageObjectSelected: "",
  }),
  getters: settingsGetters,
  actions: settingsActions,
  persist: {
    enabled: true,
    strategies: [
      {
        key: "settingsStore",
        storage: localStorage,
        paths: [
          "apiProfile",
          "appVersion",
          "brandTitle",
          "currentPath",
          "currentStudy",
          "followingHimSegment",
          "jVideoSegments",
          "textLanguageObjectSelected",
          "languageSelectorMode",
          "languages",
          "languagesUsed",
          "lessonNumber",
          "maxLessons",
          "menu",
          "menuError",
          "menuStatus",
          "previousPage",
          "seasonalContent",
          "seasonalExpires",
          "variantByStudy",
          "videoLanguageObjectSelected",
        ],
        // 👇 these hooks run when the plugin restores persisted state
        beforeRestore: (ctx) => {
          /* optional logging */
        },
        afterRestore: (ctx) => {
          ctx.store.normalizeShapes();
          if (typeof ctx.store.brandTitle !== "string")
            ctx.store.brandTitle = "";
        },
      },
    ],
  },
});
