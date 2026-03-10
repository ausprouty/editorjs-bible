
import { t, type LanguageCode } from "../i18n";
import type {
  ToolConstructable,
  ToolSettings,
} from "@editorjs/editorjs";
import Delimiter from "@editorjs/delimiter";
import Header from "@editorjs/header";
import ImageTool from "@editorjs/image";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";
import Quote from "@editorjs/quote";

import {
  DEFAULT_BIBLE_ENDPOINT_PATH,
  DEFAULT_BIBLE_LANGUAGE_CODE,
  IMAGE_UPLOAD_URL,
} from "./editorConfig";
import BiblePassageTool from
  "./tools/BiblePassageTool/BiblePassageTool";
import CollapsibleGroupTool from
  "./tools/CollapsibleGroupTool/CollapsibleGroupTool";
import CollapsibleSectionTool from
  "./tools/CollapsibleSectionTool/CollapsibleSectionTool";
import LastTimeTool from
  "./tools/LastTimeTool/LastTimeTool";
import NotesAreaTool from
  "./tools/NotesAreaTool/NotesAreaTool";
import SectionMarkerTool from
  "./tools/SectionMarker/SectionMarkerTool";
import TitleTool from
  "./tools/TitleTool/TitleTool";
import VideoTool from
  "./tools/VideoTool/VideoTool";

type EditorTools = Record<string, ToolConstructable | ToolSettings>;

function createNestedEditorTools(lang: LanguageCode): EditorTools {
  return {
    biblePassage: {
      class: BiblePassageTool as unknown as ToolConstructable,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeHL: DEFAULT_BIBLE_LANGUAGE_CODE,
      },
    },

    delimiter: {
      class: Delimiter as unknown as ToolConstructable,
    },

    header: {
      class: Header as unknown as ToolConstructable,
      config: {
        defaultLevel: 2,
        levels: [2, 3, 4],
      },
      inlineToolbar: ["link", "bold", "italic"],
    },

    list: {
      class: List as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    notesArea: {
      class: NotesAreaTool as unknown as ToolConstructable,
    },

    paragraph: {
      class: Paragraph as unknown as ToolConstructable,
      inlineToolbar: ["link", "bold", "italic"],
    },

    quote: {
      class: Quote as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    sectionMarker: {
      class: SectionMarkerTool as unknown as ToolConstructable,
    },
  };
}

export function createEditorTools(lang: LanguageCode): EditorTools {
  return {
    biblePassage: {
      class: BiblePassageTool as unknown as ToolConstructable,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeHL: DEFAULT_BIBLE_LANGUAGE_CODE,
      },
    },

    collapsibleGroup: {
      class: CollapsibleGroupTool as unknown as ToolConstructable,
      config: {
        placeholder: "Group heading",
        tools: createNestedEditorTools(lang),
      },
    },

    collapsibleSection: {
      class: CollapsibleSectionTool as unknown as ToolConstructable,
    },

    delimiter: {
      class: Delimiter as unknown as ToolConstructable,
    },

    header: {
      class: Header as unknown as ToolConstructable,
      config: {
        defaultLevel: 2,
        levels: [2, 3, 4],
      },
      inlineToolbar: ["link", "bold", "italic"],
    },

    image: {
      class: ImageTool as unknown as ToolConstructable,
      config: {
        endpoints: {
          byFile: IMAGE_UPLOAD_URL,
        },
      },
    },
    lastTime: {
      class: LastTimeTool as any,
      config: {
        lang,
      },
      
    },

    list: {
      class: List as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    notesArea: {
      class: NotesAreaTool as unknown as ToolConstructable,
    },

    paragraph: {
      class: Paragraph as unknown as ToolConstructable,
      inlineToolbar: ["link", "bold", "italic"],
    },

    quote: {
      class: Quote as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    sectionMarker: {
      class: SectionMarkerTool as unknown as ToolConstructable,
    },
    videoEmbed: {
    class: VideoTool as any,
    config: {
      labels: {
        untitledVideo: t(lang, "untitledVideo"),
        watchOnlineTemplate: t(lang, "watchPassageOnline"),
        titleLabel: t(lang, "title"),
        urlLabel: t(lang, "videoUrl"),
        startLabel: t(lang, "startTime"),
        endLabel: t(lang, "endTime"),
        previewUnavailable: t(lang, "videoPreviewUnavailable"),
      },
    },
  },
  titleTool: {
  class: TitleTool as any,
  config: {
    languages: [
      { value: "english", label: "English" },
      { value: "spanish", label: "Spanish" },
      { value: "french", label: "French" },
    ],
    seriesOptions: [
      { value: "multiply1", label: "Multiply 1" },
      { value: "multiply2", label: "Multiply 2" },
      { value: "multiply3", label: "Multiply 3" },
    ],
  },
},
  };
}