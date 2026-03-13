import { normJF, normHL, isHLCode } from "src/utils/normalize";
import { detectDirection, applyDirection } from "src/i18n/i18nDirection";
import { i18n } from "src/boot/i18n";
import { useContentStore } from "src/stores/ContentStore";
import { MAX_LESSON_NUMBERS } from "src/constants/Defaults";
import { validateLessonNumber, validateNonEmptyString } from "./validators";

export const settingsActions = {
  applyRouteContext(payload) {
    payload = payload || {};

    var study = payload.study;
    var variant = payload.variant;
    var lesson = payload.lesson;
    var hl = payload.hl;
    var jf = payload.jf;

    // ---- STUDY ----
    if (study) {
      this.setCurrentStudy(study);
    }

    // ---- LESSON ----
    if (study && lesson != null) {
      this.setLessonNumber(study, lesson);
    }

    // ---- VARIANT (always a string) ----
    if (study && typeof this.setVariantForStudy === "function") {
      var v = typeof variant === "string" ? variant : "";
      this.setVariantForStudy(study, v);
    }

    // ---- VIDEO LANGUAGE (JF) ----
    if (jf && typeof this.setVideoLanguageSelected === "function") {
      this.setVideoLanguageSelected(jf);
    }

    // ---- TEXT LANGUAGE (HL → object) ----
    if (hl) {
      var cur = this.textLanguageObjectSelected || null;
      var curHL =
        cur && (cur.languageCodeIso || cur.languageCodeIso)
          ? String(cur.languageCodeIso || cur.languageCodeIso)
          : "";

      if (String(hl) !== curHL) {
        var found = this.findLanguageByHL(hl);
        var langObj = found || this.makeLanguageFallback(hl, jf);
        this.setTextLanguageObjectSelected(langObj);
      }
    }
  },

  findLanguageByHL(hl) {
    var key = String(hl || "").trim();
    if (!key) return null;

    var list = Array.isArray(this.languages) ? this.languages : [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].languageCodeIso || "") === key) return list[i];
    }
    return null;
  },

  makeLanguageFallback(hl, jf) {
    return {
      name: String(hl || ""),
      ethnicName: "",
      languageCodeIso: "",
      languageCodeIso: String(hl || ""),
      languageCodeJF: String(jf || ""),
      languageCodeGoogle: "",
      textDirection: "ltr",
    };
  },

  addRecentLanguage(lang) {
    if (!lang || !lang.languageCodeIso) return;
    var key = String(lang.languageCodeIso);
    var list = Array.isArray(this.languagesUsed) ? this.languagesUsed : [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].languageCodeIso || "") !== key) out.push(list[i]);
    }
    out.unshift(lang);
    this.languagesUsed = out.slice(0, 2);
  },
  clearLanguagePrefs() {
    this.textLanguageObjectSelected = null;
    this.languagesUsed = [];
    applyDirection("ltr");
  },

  findByHL(hl) {
    var key = String(hl || "");
    var list = Array.isArray(this.languages) ? this.languages : [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].languageCodeIso || "") === key) return list[i];
    }
    return null;
  },
  normalizeShapes() {
    if (
      !this.lessonNumber ||
      typeof this.lessonNumber !== "object" ||
      Array.isArray(this.lessonNumber)
    ) {
      this.lessonNumber = { ctc: 1, lead: 1, life: 1, jvideo: 1 };
    }
    if (
      !this.maxLessons ||
      typeof this.maxLessons !== "object" ||
      Array.isArray(this.maxLessons)
    ) {
      this.maxLessons = {};
    }
    if (!Array.isArray(this.menu)) this.menu = [];
  },
  setApiProfile(val) {
    this.apiProfile =
      typeof val === "string" && val.trim() ? val.trim() : "standard";
  },
  setBrandTitle(title) {
    this.brandTitle = typeof title === "string" ? title.trim() : "";
  },
  setCurrentStudy(study) {
    if (!validateNonEmptyString(study)) {
      console.warn(`setCurrentStudy: Invalid study '${study}'.`);
      return;
    }
    this.currentStudy = study;
  },
  // --- i18n: use HL code directly as the active vue-i18n locale
  setI18nLocaleFromHL(hl) {
    const code = normHL(hl); // e.g., "eng00"
    const { global } = i18n;
    global.locale.value = code;
  },

  /**
   * End-to-end: update selection (HL/JF), switch vue-i18n locale,
   * and proactively fetch the interface bundle.
   */
  async setLanguageAndApply(payload) {
    const { hl, jf } = this.setLanguageCodes(payload); // returns applied HL/JF
    this.setI18nLocaleFromHL(hl); // locale = 'eng00' etc.
    const content = useContentStore();
    await content.loadInterface({ hl, jf }); // fetch bundle
    i18n.global.locale.value = hl;
    console.log("SettingStore.setLanguageAndApply changed interface to " + hl);
  },

  setTextLanguageObjectSelected(lang) {
    console.log("entered store to setTextLanguageObjectSelected");
    // Keep this for API stability (also updates MRU + direction)
    if (!lang) return;
    this.textLanguageObjectSelected = lang;
    this.addRecentLanguage(lang);
    applyDirection(detectDirection(lang));
  },

  setVideoLanguageObjectSelected(lang) {
    if (!lang || typeof lang !== "object") {
      this.videoLanguageObjectSelected = null;
      return;
    }
    // Keep codes clean and consistent (strings, trimmed)
    var jf =
      lang.languageCodeJF != null ? String(lang.languageCodeJF).trim() : "";
    var hl =
      lang.languageCodeIso != null ? String(lang.languageCodeIso).trim() : "";

    this.videoLanguageObjectSelected = {
      ...lang,
      languageCodeJF: jf,
      languageCodeIso: hl,
    };
  },

  // this routine has to be wrong

  setLanguageCodes(payload) {
    // payload: { hl, jf }  (either may be provided)
    var hl = normHL(payload && payload.hl);
    var jf = normJF(payload && payload.jf);

    // Build/merge a selected object
    var base =
      (hl && this.findByHL(hl)) ||
      (this.textLanguageObjectSelected
        ? { ...this.textLanguageObjectSelected }
        : null) ||
      {};
    if (hl) base.languageCodeIso = hl;
    if (jf) base.languageCodeJF = jf;

    // Reasonable fallbacks for display
    if (!base.name) base.name = hl || base.languageCodeIso || "";
    if (!base.ethnicName) base.ethnicName = base.ethnicName || "";

    // Apply selection (handles MRU + direction + persist)
    this.setTextLanguageObjectSelected(base);
    return true;
  },

  // ------- Wrappers (backward compatible) -------
  setLanguageCodeText
    this.setTextLanguageSelected(code);
  },

  setLanguageCodeJF(code) {
    var jf = normJF(code);
    if (!jf) {
      console.warn("setLanguageCodeJF: invalid JF '" + code + "'.");
      return false;
    }
    var curHL =
      (this.textLanguageObjectSelected &&
        this.textLanguageObjectSelected.languageCodeIso) ||
      "";
    this.setLanguageCodes({ hl: curHL, jf: jf });
    return true;
  },

  setLanguages(newLanguages) {
    if (!Array.isArray(newLanguages)) {
      console.warn(`setLanguages: Invalid languages input.`);
      return;
    }
    this.languages = newLanguages;
  },

  setLessonNumber(study, lesson) {
    var s = String(study || "").trim();
    if (!s) return;

    var parsedLesson = validateLessonNumber(lesson);
    if (parsedLesson === null) return;

    var max =
      MAX_LESSON_NUMBERS && MAX_LESSON_NUMBERS[s]
        ? MAX_LESSON_NUMBERS[s]
        : null;

    var clamped = max ? Math.min(parsedLesson, max) : parsedLesson;

    if (!this.lessonNumber || typeof this.lessonNumber !== "object") {
      this.lessonNumber = {};
    }

    // Ensure reactivity (Pinia/Vue generally handles this, but copy is safest)
    var copy = Object.assign({}, this.lessonNumber);
    copy[s] = clamped;
    this.lessonNumber = copy;
  },

 
};
