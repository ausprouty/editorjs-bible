<script setup lang="ts">
import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

import { createEditor } from "../../editor/createEditor";
import type { LanguageCode } from "../../i18n";

const props = defineProps<{
  lang: LanguageCode;
  modelValue?: OutputData;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: OutputData): void;
  (e: "ready"): void;
}>();

const holderId = "editorjs-host";
const editorInstance = ref<EditorJS | null>(null);
const isApplyingExternalData = ref(false);
const lastSavedJson = ref("");

function stableStringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}

async function createEditorInstance(): Promise<void> {
  await nextTick();

  const editor = createEditor({
    holder: holderId,
    data: props.modelValue,
    lang: props.lang,
  });

  editorInstance.value = editor;

  await editor.isReady;

  const initialOutput = await editor.save();
  lastSavedJson.value = stableStringify(initialOutput);
  emit("update:modelValue", initialOutput);
  emit("ready");
}

async function destroyEditorInstance(): Promise<void> {
  const editor = editorInstance.value;

  if (!editor) {
    return;
  }

  editor.destroy();
  editorInstance.value = null;
}

async function rebuildEditor(): Promise<void> {
  await destroyEditorInstance();
  await createEditorInstance();
}

async function emitSavedOutput(): Promise<void> {
  const editor = editorInstance.value;

  if (!editor || isApplyingExternalData.value) {
    return;
  }

  const output = await editor.save();
  const json = stableStringify(output);

  if (json === lastSavedJson.value) {
    return;
  }

  lastSavedJson.value = json;
  emit("update:modelValue", output);
}

onMounted(async () => {
  await createEditorInstance();

  const saver = async () => {
    await emitSavedOutput();
  };

  const root = document.getElementById(holderId);

  if (root) {
    root.addEventListener("input", saver);
    root.addEventListener("focusout", saver);
  }
});

onBeforeUnmount(async () => {
  await destroyEditorInstance();
});

watch(
  () => props.lang,
  async () => {
    await rebuildEditor();
  }
);

watch(
  () => props.modelValue,
  async (newValue) => {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    const incomingJson = stableStringify(newValue);

    if (incomingJson === lastSavedJson.value) {
      return;
    }

    isApplyingExternalData.value = true;

    try {
      await editor.render(
        newValue || {
          blocks: [],
          time: Date.now(),
          version: "2.31.4",
        }
      );

      const saved = await editor.save();
      lastSavedJson.value = stableStringify(saved);
    } finally {
      isApplyingExternalData.value = false;
    }
  },
  { deep: true }
);

defineExpose({
  async save(): Promise<OutputData | null> {
    const editor = editorInstance.value;

    if (!editor) {
      return null;
    }

    const output = await editor.save();
    lastSavedJson.value = stableStringify(output);
    emit("update:modelValue", output);
    return output;
  },

  async clear(): Promise<void> {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    await editor.clear();

    const output = await editor.save();
    lastSavedJson.value = stableStringify(output);
    emit("update:modelValue", output);
  },

  async render(output: OutputData): Promise<void> {
    const editor = editorInstance.value;

    if (!editor) {
      return;
    }

    isApplyingExternalData.value = true;

    try {
      await editor.render(output);
      const saved = await editor.save();
      lastSavedJson.value = stableStringify(saved);
      emit("update:modelValue", saved);
    } finally {
      isApplyingExternalData.value = false;
    }
  },
});
</script>

<template>
  <div :id="holderId" class="editor-host"></div>
</template>

<style scoped>
.editor-host {
  min-height: 500px;
}
</style>