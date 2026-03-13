<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useSettingsStore } from "src/stores/SettingsStore";
import { getNote } from "src/services/NoteService";
import { getStudyProgress } from "src/services/IndexedDBService";
import { useSiteContent } from "src/composables/useSiteContent";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const settingsStore = useSettingsStore();

const hl = computed(function () {
  var obj = settingsStore.textLanguageObjectSelected || null;
  var code = obj && obj.languageCodeIso
    ? String(obj.languageCodeIso)
    : "";
  code = code.trim();
  return code ? code : "eng00";
});

const cleanedNote = ref("");
const noteLines = ref([]);
const hasNote = ref(false);

const { getSection } = useSiteContent(hl);

const review = computed(function () {
  return getSection("review");
});

const reviewIntro = computed(function () {
  return review.value && Array.isArray(review.value.paras)
    ? review.value.paras
    : [];
});

const reviewEmpty = computed(function () {
  var s = review.value && review.value.empty
    ? review.value.empty
    : "";
  s = String(s).trim();
  return s;
});

async function loadPreviousNote() {
  const study = settingsStore.currentStudySelected;

  if (!study) {
    resetNote();
    return;
  }

  try {
    const progress = await getStudyProgress(study);
    const lastLesson = progress && progress.lastCompletedLesson
      ? progress.lastCompletedLesson
      : null;

    if (!lastLesson || typeof lastLesson !== "number") {
      resetNote();
      return;
    }

    const note = await getNote(study, lastLesson, "look_forward");
    const trimmed = note ? note.trim() : "";

    if (trimmed) {
      cleanedNote.value = trimmed;
      noteLines.value = trimmed
        .split(/\r?\n/)
        .filter(function (line) {
          return line.trim() !== "";
        });
      hasNote.value = true;
    } else {
      resetNote();
    }
  } catch (err) {
    console.error("Failed to load previous note:", err);
    resetNote();
  }
}

function resetNote() {
  hasNote.value = false;
  cleanedNote.value = "";
  noteLines.value = [];
}

onMounted(loadPreviousNote);

watch(
  function () {
    return settingsStore.currentStudySelected;
  },
  loadPreviousNote,
);

watch(
  function () {
    return hl.value;
  },
  loadPreviousNote,
);
</script>

<template>
  <div class="last-time-block">
    <template v-if="hasNote">
      <p
        v-for="(para, index) in reviewIntro"
        :key="'review-' + index"
      >
        {{ para }}
      </p>

      <p
        v-for="(line, index) in noteLines"
        :key="'note-' + index"
      >
        <strong>{{ line }}</strong>
      </p>
    </template>

    <template v-else>
      <p>{{ reviewEmpty }}</p>
    </template>
  </div>
</template>

<style scoped>
.last-time-block {
  background-color: var(--color-minor1);
  border-left: 6px solid var(--color-highlight-scripture);
  padding: 16px 20px;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px var(--color-shadow);
  font-size: 15px;
  color: var(--color-minor2);
  transition: background-color 0.3s ease;
}

.last-time-block p {
  margin: 8px 0;
  line-height: 1.5;
}

.last-time-block strong {
  color: var(--color-primary);
  font-size: 16px;
}
</style>