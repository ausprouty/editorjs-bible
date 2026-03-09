<script setup lang="ts">
import type { OutputData } from "@editorjs/editorjs";
import { computed, ref, useTemplateRef, watch } from "vue";

import DeveloperPanel from "../components/editor/DeveloperPanel.vue";
import EditorHost from "../components/editor/EditorHost.vue";
import {
  getCurrentLanguage,
  setCurrentLanguage,
} from "../i18n/languageState";
import {
  languageOptions,
  type LanguageCode,
} from "../i18n";
import {
  getTemplatesByLanguage,
  loadTemplateFile,
} from "../templates";

const STORAGE_KEY = "editorjs-demo-content";

const currentLang = ref<LanguageCode>(getCurrentLanguage());
const output = ref<OutputData | undefined>(loadInitialData());
const editorHost = useTemplateRef("editorHost");

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

const templates = computed(() => {
  return getTemplatesByLanguage(currentLang.value);
});

const selectedTemplateKey = ref("");

watch(
  templates,
  (items) => {
    if (!items.length) {
      selectedTemplateKey.value = "";
      return;
    }

    const exists = items.some((item) => {
      return item.key === selectedTemplateKey.value;
    });

    if (!exists) {
      selectedTemplateKey.value = items[0].key;
    }
  },
  { immediate: true }
);

watch(currentLang, (value) => {
  setCurrentLanguage(value);
});

async function onLoadTemplate(): Promise<void> {
  if (!selectedTemplateKey.value) {
    return;
  }

  const templateFile = await loadTemplateFile(
    selectedTemplateKey.value,
    currentLang.value
  );

  if (!templateFile) {
    return;
  }

  const nextOutput: OutputData = {
    time: Date.now(),
    version: "2.30.0",
    blocks: templateFile.blocks,
  };

  output.value = nextOutput;

  if (editorHost.value) {
    await editorHost.value.render(nextOutput);
  }
}

async function onSave(): Promise<void> {
  if (!editorHost.value) {
    return;
  }

  const saved = await editorHost.value.save();

  if (!saved) {
    return;
  }

  output.value = saved;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

async function onClear(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);

  const cleared: OutputData = {
    blocks: [],
    time: Date.now(),
    version: "0.0.0",
  };

  output.value = cleared;

  if (editorHost.value) {
    await editorHost.value.clear();
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <h1>Editor.js Editor</h1>

      <div class="toolbar-row">
        <label class="field-group">
          <span>Language</span>
          <select v-model="currentLang">
            <option
              v-for="option in languageOptions"
              :key="option.code"
              :value="option.code"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="field-group">
          <span>Template</span>
          <select v-model="selectedTemplateKey">
            <option
              v-for="template in templates"
              :key="template.key"
              :value="template.key"
            >
              {{ template.label }}
            </option>
          </select>
        </label>

        <div class="actions">
          <button
            id="btn-load-template"
            type="button"
            @click="onLoadTemplate"
          >
            Load Template
          </button>
          <button id="btn-save" type="button" @click="onSave">
            Save
          </button>
          <button id="btn-clear" type="button" @click="onClear">
            Clear
          </button>
        </div>
      </div>
    </header>

    <main class="layout">
      <section class="panel">
        <h2>Editor</h2>

        <EditorHost
          ref="editorHost"
          v-model="output"
          :lang="currentLang"
        />

        <p class="hint">
          Tip: add a block, choose “Bible Passage”, enter a
          reference, then fetch.
        </p>
      </section>

      <DeveloperPanel :output="output" />
    </main>
  </div>
</template>