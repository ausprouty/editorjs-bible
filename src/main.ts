import EditorJS, { type OutputData } from "@editorjs/editorjs";
import "./style.css";
import BiblePassageTool from "./tools/BiblePassageTool";
import SectionMarkerTool from "./tools/SectionMarkerTool";
import { getTemplatesByLanguage } from "./templates";
import Paragraph from "@editorjs/paragraph";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Delimiter from "@editorjs/delimiter";
import {
  getCurrentLanguage,
  setCurrentLanguage,
} from "./i18n/languageState";
import {
  languageOptions,
  t,
  type LanguageCode,
} from "./i18n";

const STORAGE_KEY = "editorjs-demo-content";

let currentLang: LanguageCode = getCurrentLanguage();

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element: #${id}`);
  }
  return el as T;
}

function renderLanguagePicker(): void {
  const host = document.getElementById("language-picker");
  if (!host) {
    return;
  }

  const select = document.createElement("select");

  languageOptions.forEach((option) => {
    const el = document.createElement("option");
    el.value = option.code;
    el.textContent = option.label;
    el.selected = option.code === currentLang;
    select.appendChild(el);
  });

  select.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement;
  currentLang = target.value as LanguageCode;
  setCurrentLanguage(currentLang);
  renderSampleText();
  renderTemplatePicker();
});

  host.innerHTML = "";
  host.appendChild(select);
}

function renderSampleText(): void {
  const host = document.getElementById("sample-text");
  if (!host) {
    return;
  }

  host.textContent = t(currentLang, "sectionMarker.lookBack");
}

function renderTemplatePicker(): void {
  const host = document.getElementById("template-picker");
  if (!host || !(host instanceof HTMLSelectElement)) {
    return;
  }

  host.innerHTML = "";

  const items = getTemplatesByLanguage(currentLang);

  items.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.key;
    option.textContent = template.label;
    host.appendChild(option);
  });
}

function loadInitialData(): OutputData | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as OutputData;
  } catch {
    return undefined;
  }
}

function renderOutput(output: OutputData): void {
  const pre = getEl<HTMLPreElement>("output");
  pre.textContent = JSON.stringify(output, null, 2);
}

const initialData = loadInitialData();
if (initialData) {
  renderOutput(initialData);
}

const editor = new EditorJS({
  holder: "editorjs",
  autofocus: true,
  data: initialData,
  tools: {
    paragraph: {
      class: Paragraph,
      inlineToolbar: ["link", "bold", "italic"],
    },

    header: {
      class: Header as any,
      inlineToolbar: ["link", "bold", "italic"],
      config: {
        levels: [2, 3, 4],
        defaultLevel: 2,
      },
    },

    list: {
      class: List as any,
      inlineToolbar: true,
    },

    quote: {
      class: Quote as any,
      inlineToolbar: true,
    },

    delimiter: {
      class: Delimiter as any,
    },

    sectionMarker: {
      class: SectionMarkerTool as any,
    },

    biblePassage: {
      class: BiblePassageTool as any,
      config: {
        endpointPath: "/v2/bible/passage",
        languageCodeHL: "eng00",
      },
    },
  },
});

const btnLoadTemplate = getEl<HTMLButtonElement>("btn-load-template");

btnLoadTemplate.addEventListener("click", async () => {
  const picker = getEl<HTMLSelectElement>("template-picker");
  const template = getTemplateByKey(picker.value);

  if (!template) {
    return;
  }

  const output = template.build();
  await editor.render(output);
  renderOutput(output);
});

const btnSave = getEl<HTMLButtonElement>("btn-save");
btnSave.addEventListener("click", async () => {
  const output = await editor.save();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(output));
  renderOutput(output);
});

const btnClear = getEl<HTMLButtonElement>("btn-clear");
btnClear.addEventListener("click", async () => {
  localStorage.removeItem(STORAGE_KEY);
  renderOutput({ time: Date.now(), blocks: [], version: "0.0.0" });
  await editor.clear();
});

renderTemplatePicker();
renderLanguagePicker();
renderSampleText();