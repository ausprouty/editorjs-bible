import { type OutputData } from "@editorjs/editorjs";

import { createEditor } from "./editor/createEditor";
import {
  getCurrentLanguage,
  setCurrentLanguage,
} from "./i18n/languageState";
import {
  languageOptions,
  t,
  type LanguageCode,
} from "./i18n";
import "./styles/system.css";
import { getTemplatesByLanguage } from "./templates";

const STORAGE_KEY = "editorjs-demo-content";

let currentLang: LanguageCode = getCurrentLanguage();

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);

  if (!el) {
    throw new Error(`Missing element: #${id}`);
  }

  return el as T;
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

function renderOutput(output: OutputData): void {
  const pre = getEl<HTMLPreElement>("output");
  pre.textContent = JSON.stringify(output, null, 2);
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

const initialData = loadInitialData();

if (initialData) {
  renderOutput(initialData);
}

const editor = createEditor({
  data: initialData,
  holder: "editorjs",
});

const btnClear = getEl<HTMLButtonElement>("btn-clear");
btnClear.addEventListener("click", async () => {
  localStorage.removeItem(STORAGE_KEY);
  renderOutput({
    blocks: [],
    time: Date.now(),
    version: "0.0.0",
  });
  await editor.clear();
});

const btnLoadTemplate = getEl<HTMLButtonElement>("btn-load-template");
btnLoadTemplate.addEventListener("click", async () => {
  const picker = getEl<HTMLSelectElement>("template-picker");
  const template = getTemplatesByLanguage(currentLang).find(
    (item) => item.key === picker.value
  );

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

renderLanguagePicker();
renderSampleText();
renderTemplatePicker();