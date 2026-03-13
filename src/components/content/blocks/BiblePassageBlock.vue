<script setup>
import { ref } from "vue";
import "../shared/blockHeader.css";
import "./BiblePassageBlock.css";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const isOpen = ref(
  typeof props.data.isOpen === "boolean"
    ? props.data.isOpen
    : true,
);

function toggleOpen() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <section class="bible-passage-block">
    <button
      type="button"
      class="bible-passage-block__header tool-header"
      :data-open="isOpen ? 'true' : 'false'"
      @click="toggleOpen"
    >
      <span class="tool-header__left">
        <span class="tool-header__icon tool-header__icon--text">
          ✟
        </span>
        <span class="tool-header__text">
          Read {{ data.reference || "" }}
        </span>
      </span>

      <span class="tool-header__right">
        <span class="tool-header__toggle">
          {{ isOpen ? "−" : "+" }}
        </span>
      </span>
    </button>

    <div
      v-show="isOpen"
      class="bible-passage-block__passage"
      v-html="data.passage || ''"
    />
  </section>
</template>