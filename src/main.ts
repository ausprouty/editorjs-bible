import EditorJS, { type OutputData } from "@editorjs/editorjs";
import "./style.css";
import BiblePassageTool from "./tools/BiblePassageTool";

const STORAGE_KEY = "editorjs-demo-content";

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element: #${id}`);
  }
  return el as T;
}

function loadInitialData(): OutputData | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;

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
    biblePassage: {
      class: BiblePassageTool as any as new (...args: unknown[]) => unknown,
      config: {
        endpointPath: "/v2/bible/passage",
        languageCodeHL: "eng00",
      },
    },
  },
});

const btnSave = getEl<HTMLButtonElement>("btn-save");
btnSave.addEventListener("click", () => {
  void (async () => {
    const output = await editor.save();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(output));
    renderOutput(output);
  })();
});

const btnClear = getEl<HTMLButtonElement>("btn-clear");
btnClear.addEventListener("click", () => {
  void (async () => {
    localStorage.removeItem(STORAGE_KEY);
    renderOutput({ time: Date.now(), blocks: [], version: "0.0.0" });
    await editor.clear();
  })();
});