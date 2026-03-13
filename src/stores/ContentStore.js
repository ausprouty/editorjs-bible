// src/stores/content.js
import { defineStore } from "pinia";
import * as ContentKeys from "src/utils/ContentKeyBuilder";
import { getCommonContent } from "../services/CommonContentService.js";
import { getLessonContent } from "../services/LessonContentService.js";
import { getSiteContent } from "../services/SiteContentService.js";
import { getTranslatedInterface } from "../services/InterfaceService.js";
import { buildVideoSource } from "@/utils/videoSource";
import { unref } from "vue";
import { normalizeSiteContentPayload } from "src/utils/normalizeSiteContent.js";
import { validateLessonNumber } from "./validators";
import { i18n } from "src/boot/i18n";
// for use by loadInterface

let lastInterfaceReq = 0;

export const useContentStore = defineStore("contentStore", {
  state: () => ({
    siteContent: {}, // {'siteContent-${hl}': json}
    commonContent: {}, // {'commonContent-${study}-${hl}': json}
    lessonContent: {}, // {'lessonContent-${study}-${hl}-${jf}-lesson-${n}': json}
    videoUrls: {}, // {'videoUrls-${study}-${jf}': [url1, url2]}
    // cache for video meta per study
    _videoMetaByStudy: {}, // { [study]: { provider, segments, meta } }
    translationComplete: {
      interface: false,
      commonContent: false,
      lessonContent: false,
    },
  }),

  getters: {
    commonContentFor: (state) => (study, variant, hl) => {
      const key = ContentKeys.buildCommonContentKey(study, variant, hl);
      console.log("CommonContentFor was asked for " + key);
      const value = state.commonContent[key];
      console.log(value);

      if (!value) {
        return null;
      }
      if (typeof value !== "object") {
        console.warn(
          "[ContentStore.commonContentFor] non-object value in store",
          { key, study, variant, hl, value }
        );
        return null;
      }
      return value;
    },

    lessonContentFor: (state) => (study, hl, jf, lesson) => {
      const key = ContentKeys.buildLessonContentKey(study, hl, jf, lesson);
      "LessonContentFor was asked for " + key;
      const value = state.lessonContent[key];

      if (!value) {
        return null;
      }

      if (typeof value !== "object") {
        console.warn(
          "[ContentStore.lessonContentFor] non-object value in store",
          { key, study, hl, jf, lesson, value }
        );
        return null;
      }

      return value;
    },

    lessonContentSourceFor: (state) => (study, variant, hl) => {
      const key = ContentKeys.buildCommonContentKey(study, variant, hl);
      const cc = state.commonContent[key];

      if (!cc || typeof cc !== "object") return null;
      const meta = cc.meta;

      if (!meta || typeof meta !== "object") return null;

      // allow either missing (null) or explicit string
      return typeof meta.lessonContentSource === "string"
        ? meta.lessonContentSource
        : null;
    },

    siteContentFor: (state) => (hl) => {
      const key = ContentKeys.buildSiteContentKey(hl);
      console.log("SiteContentFor was asked for " + key);
      const value = state.siteContent[key];

      if (!value) {
        return null;
      }

      if (typeof value !== "object") {
        console.warn(
          "[ContentStore.siteContentFor] non-object value in store",
          { key, hl, value }
        );
        return null;
      }
      console.log(value);

      return value;
    },

    videoUrlsFor: (state) => (study, jf) => {
      const key = ContentKeys.buildVideoUrlsKey(study, jf);
      return state.videoUrls[key] || [];
    },

    isFullyTranslated: (state) => {
      return Object.values(state.translationComplete).every(Boolean);
    },

    // Optional convenience
    videoMetaFor: (state) => (study) => state._videoMetaByStudy[study] || null,
  },

  actions: {
    async getVideoSourceFor(study, languageHL, languageJF, lesson) {
      const meta = await this.getStudyVideoMeta(study); // { provider, segments, meta }
      const result = buildVideoSource({
        provider: meta.provider,
        study,
        lesson,
        languageHL,
        languageJF,
        meta: meta.meta, // contains autoJF61: true
      });
      return result; // { kind: "iframe", src: "...", poster?, title? }
    },

    // moves retrieved common content into Content Store
    setCommonContent(study, variant, hl, data) {
      const key = ContentKeys.buildCommonContentKey(study, variant, hl);
      if (!key) {
        console.warn(
          "setCommonContent: commonContent key is null; skipping set.",
          { study, variant, hl }
        );
        return;
      }
      if (variant && typeof variant === "object") {
        console.error("variant is not a string", { variant });
      }

      // Guard against accidentally storing the store itself
      if (data && typeof data === "object" && data.$id === "contentStore") {
        console.error(
          "setCommonContent: BUG – received contentStore instance as data.",
          { key, study, variant, hl }
        );
        return;
      }
      if (!data || typeof data !== "object") {
        console.warn(
          "setCommonContent: ignoring non-object commonContent payload.",
          { key, study, variant, hl, data }
        );
        return;
      }
      console.log("[setCommonContent call]", {
        study: typeof study,
        variant: typeof variant,
        hl: typeof hl,
      });

      this.commonContent[key] = data;
    },

    // moves retrieved lesson content into Content Store
    setLessonContent(study, hl, jf, lesson, data) {
      const key = ContentKeys.buildLessonContentKey(study, hl, jf, lesson);
      if (!key) {
        console.warn(
          "setLessonContent: lessonContent key is null; skipping set.",
          { study, hl, jf, lesson }
        );
        return;
      }
      if (!data || typeof data !== "object") {
        console.warn("setLessonContent: ignoring non-object lesson payload.", {
          key,
          study,
          hl,
          jf,
          lesson,
          data,
        });
        return;
      }
      this.lessonContent[key] = data;
    },

    setSiteContent(hl, data) {
      const key = ContentKeys.buildSiteContentKey(hl);
      if (!key) {
        console.warn("setSiteContent: siteContent key is null; skipping set.", {
          hl,
        });
        return;
      }

      if (data && typeof data === "object" && data.$id === "contentStore") {
        console.error(
          "setSiteContent: BUG – received contentStore instance as data.",
          { key, hl }
        );
        return;
      }

      if (!data || typeof data !== "object") {
        console.warn(
          "setSiteContent: ignoring non-object siteContent payload.",
          { key, hl, data }
        );
        return;
      }

      const normalized = normalizeSiteContentPayload(data);
      if (!normalized) {
        console.warn("setSiteContent: failed to normalize siteContent.", {
          key,
          hl,
        });
        return;
      }

      this.siteContent[key] = normalized;
    },

    // moves retreived videoURLs  into Content Store which I plan to remove
    setVideoUrls(study, jf, data) {
      const key = ContentKeys.buildVideoUrlsKey(study, jf);
      if (key) {
        this.videoUrls[key] = data;
      } else {
        console.warn("videoUrls key is null — skipping set.");
      }
    },
    // this is the good stuff.  We get the common content from
    // either the database (if we can), or go to the API
    async loadCommonContent(study, variant, hl) {
      //getCommonContent stores it via storeSetter/onInstall
      const data = await getCommonContent(study, variant, hl); // fetch/cache only
      console.log(
        "ContentStore.loadCommonContent loaded",
        { study, variant, hl, ok: !!data },
        data
      );
      return data;
    },
    //  We get the interface content from
    // either the database (if we can), or go to the API
    async loadInterface(hl) {
      const data = await getTranslatedInterface(hl); // fetch/cache only
      console.log("ContentStore.loadInterface", { hl, hasData: !!data, data });
      return data;
    },

    async loadSiteContent(hl) {
      const data = await getSiteContent(hl); // fetch/cache only
      console.log("ContentStore.loadSiteContent", {
        hl,
        hasData: !!data,
        data,
      });
      return data;
    },

    // We get the lesson content from
    // either the database (if we can), or go to the API
    // lessonContent DOES NOT have a variant value
    async loadLessonContent(study, hl, jf, lesson, commonContent = null) {
      const vl = validateLessonNumber(unref(lesson));
      if (vl === null) {
        console.warn(`Invalid lesson '${unref(lesson)}'`);
        return null;
      }
      try {
        return await getLessonContent(study, hl, jf, vl, commonContent);
      } catch (e) {
        console.error("[ContentStore.loadLessonContent] failed", e);
        throw e;
      }
    },
    // I want to get rid of this
    async loadVideoUrls(jf, study) {
      return await getJesusVideoUrls(jf, study);
    },
    // used in resetting
    clearAllContent() {
      this.commonContent = {};
      this.lessonContent = {};
      this.videoUrls = {};
      this._videoMetaByStudy = {};
    },

    setTranslationComplete(section, value) {
      if (
        Object.prototype.hasOwnProperty.call(this.translationComplete, section)
      ) {
        this.translationComplete[section] = value;
      }
    },

    clearTranslationComplete() {
      for (const k in this.translationComplete) {
        this.translationComplete[k] = false;
      }
    },

    // ---------- Video meta API  ----------

    /**
     * Return { provider, segments, meta } for a study.
     * Caches per study in state._videoMetaByStudy.
     * JESUS film (“jvideo”) is 61 segments and uses auto jf61 refs.
     */
    async getStudyVideoMeta(study) {
      if (this._videoMetaByStudy[study]) {
        return this._videoMetaByStudy[study];
      }

      let meta;
      switch (study) {
        case "jvideo":
          meta = {
            provider: "arclight",
            segments: 61,
            meta: {
              // tells the util to build refs like 1_<JF>-jf61LL-0-0
              autoJF61: true,
            },
          };
          break;

        default:
          // Example default: simple single-lesson vimeo
          meta = {
            provider: "vimeo",
            segments: 1,
            meta: {
              // vimeoId: "123456789",
              // or: lessons: { "1": { vimeoId: "..." } }
            },
          };
          break;
      }

      this._videoMetaByStudy[study] = meta;
      return meta;
    },

    /**
     * Manually override meta for a study (e.g., from config/API).
     */
    setStudyVideoMeta(study, value) {
      this._videoMetaByStudy[study] = value;
    },
  },
});
