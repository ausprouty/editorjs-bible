// src/stores/settingsGetters.js
import { DEFAULTS, MAX_LESSON_NUMBERS } from "src/constants/Defaults.js";
import { normHL, normJF } from "src/utils/normalize.js";

export const settingsGetters = {
  currentLanguage(state) {
    // If you like this alias, keep it—but it’s redundant with languageSelected
    return state.textLanguageObjectSelected;
  },

  currentStudySelected(state) {
    var s = state.currentStudy;
    return s && String(s).trim() ? s : DEFAULTS.study;
  },

  isAtMaxLesson(state) {
    var study = state.currentStudy || DEFAULTS.study;

    var dict = state.lessonNumber || {};
    var raw = dict instanceof Map ? dict.get(study) : dict[study];
    var lesson = Number(raw);

    var maxRaw =
      MAX_LESSON_NUMBERS &&
      Object.prototype.hasOwnProperty.call(MAX_LESSON_NUMBERS, study)
        ? MAX_LESSON_NUMBERS[study]
        : undefined;
    var max = Number(maxRaw);

    if (
      !Number.isFinite(lesson) ||
      lesson < 1 ||
      !Number.isFinite(max) ||
      max < 1
    ) {
      console.warn(
        "isAtMaxLesson: Invalid values for '" +
          study +
          "'. lesson=" +
          lesson +
          ", max=" +
          max
      );
      return false;
    }
    return lesson >= max;
  },

  isStandardProfile(state) {
    return state.apiProfile === "standard";
  },

  languageCodeIsoSelected(state) {
    var ls = state.textLanguageObjectSelected || {};
    var raw = ls.languageCodeIso != null ? String(ls.languageCodeIso) : "";
    var c = normHL(raw); // 3 letters + 2 digits; preserves case
    return c || DEFAULTS.languageCodeIso; // e.g., "eng00"
  },

  languageCodeJFSelected(state) {
    // 1) video language object (preferred)
    var v = state.videoLanguageObjectSelected || null;
    var raw = v && v.languageCodeJF != null ? String(v.languageCodeJF) : "";
    var c = normJF(raw); // digits only
    if (c) return c;

    // 2) fallback to text language object
    var t = state.textLanguageObjectSelected || null;
    raw = t && t.languageCodeJF != null ? String(t.languageCodeJF) : "";
    c = normJF(raw);
    if (c) return c;

    // 3) default
    return DEFAULTS.languageCodeJF; // e.g., "529"
  },

  languageDirection(state) {
    const ls = state.textLanguageObjectSelected || {};
    const dir = (ls.textDirection || "").toLowerCase();
    return dir === "rtl" ? "rtl" : "ltr";
  },

  languageIdSelected(state) {
    var ls = state.textLanguageObjectSelected || {};
    var v = ls.languageId;
    return v == null ? null : v;
  },

  // Always safe to read: returns selected object or a fallback stub
  textLanguageSelected(state) {
    // Prefer the selected object if it looks valid
    var ls = state.textLanguageObjectSelected || null;
    var hl =
      ls && ls.languageCodeIso != null ? String(ls.languageCodeIso).trim() : "";
    if (hl) return ls;

    // Try to resolve DEFAULTS.languageCodeIso to a real object in the catalog
    var list = Array.isArray(state.languages) ? state.languages : [];
    var defHL = String(DEFAULTS.languageCodeIso || "").trim();

    for (var i = 0; i < list.length; i++) {
      var itemHL =
        list[i] && list[i].languageCodeIso != null
          ? String(list[i].languageCodeIso).trim()
          : "";
      if (itemHL && itemHL === defHL) return list[i];
    }

    // Last resort: return a consistent minimal object (still an object)
    return {
      languageCodeIso: defHL,
      languageCodeJF: String(DEFAULTS.languageCodeJF || "").trim(),
    };
  },

  // Getter that returns a function
  lessonNumberForStudy(state) {
    return function (studyArg) {
      var study = String(studyArg || state.currentStudy || "dbs").trim();
      if (!study) study = "dbs";

      var dict = state.lessonNumber || {};
      var raw = Object.prototype.hasOwnProperty.call(dict, study)
        ? dict[study]
        : 1;

      var lesson = Number(raw);
      return Number.isFinite(lesson) && lesson >= 1 ? lesson : 1;
    };
  },

  maxLesson(state) {
    var study = state.currentStudy || DEFAULTS.study;
    if (
      !MAX_LESSON_NUMBERS ||
      !Object.prototype.hasOwnProperty.call(MAX_LESSON_NUMBERS, study)
    ) {
      console.warn("maxLesson: '" + study + "' not found. Returning 1.");
      return 1;
    }
    var max = Number(MAX_LESSON_NUMBERS[study]);
    if (!Number.isFinite(max) || max < 1) {
      console.warn(
        "maxLesson: '" + study + "' invalid max '" + max + "'. Returning 1."
      );
      return 1;
    }
    return max;
  },

  recentLanguages(state) {
    return state.languagesUsed || [];
  },

  
};
