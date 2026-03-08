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

export function createEditorTools() {
  return {
    biblePassage: {
      class: BiblePassageTool as any,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeHL: DEFAULT_BIBLE_LANGUAGE_CODE,
      },
    },

    collapsibleSection: {
      class: CollapsibleSectionTool as any,
    },

    delimiter: {
      class: Delimiter as any,
    },

    header: {
      class: Header as any,
      config: {
        defaultLevel: 2,
        levels: [2, 3, 4],
      },
      inlineToolbar: ["link", "bold", "italic"],
    },

    image: {
      class: ImageTool,
      config: {
        endpoints: {
          byFile: IMAGE_UPLOAD_URL,
        },
      },
    },

    list: {
      class: List as any,
      inlineToolbar: true,
    },

    notesArea: {
      class: NotesAreaTool as any,
    },

    paragraph: {
      class: Paragraph,
      inlineToolbar: ["link", "bold", "italic"],
    },

    quote: {
      class: Quote as any,
      inlineToolbar: true,
    },

    sectionMarker: {
      class: SectionMarkerTool as any,
    },
  };
}