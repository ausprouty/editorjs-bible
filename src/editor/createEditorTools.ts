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
  "../tools/BiblePassageTool/BiblePassageTool";
import CollapsibleSectionTool from
  "../tools/CollapsibleSectionTool/CollapsibleSectionTool";
import NotesAreaTool from "../tools/NotesAreaTool/NotesAreaTool";
import SectionMarkerTool from
  "../tools/SectionMarker/SectionMarkerTool";

type EditorTools = Record<string, ToolConstructable | ToolSettings>;

export function createEditorTools(): EditorTools {
  return {
    biblePassage: {
      class: BiblePassageTool as unknown as ToolConstructable,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeHL: DEFAULT_BIBLE_LANGUAGE_CODE,
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