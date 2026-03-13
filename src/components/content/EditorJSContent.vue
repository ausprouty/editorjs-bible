<script setup>
import ParagraphBlock from "./blocks/ParagraphBlock.vue";
import HeaderBlock from "./blocks/HeaderBlock.vue";
import ListBlock from "./blocks/ListBlock.vue";
import OikosListBlock from "./blocks/OikosListBlock.vue";
import VideoBlock from "./blocks/VideoBlock.vue";
import BiblePassageBlock from "./blocks/BiblePassageBlock.vue";
import LastTimeBlock from "./blocks/LastTimeBlock.vue";

const props = defineProps({
  content: {
    type: Object,
    required: true,
  },
});

function resolveBlockComponent(type) {
  if (type === "paragraph") {
    return ParagraphBlock;
  }

  if (type === "header") {
    return HeaderBlock;
  }

  if (type === "list") {
    return ListBlock;
  }

  if (type === "oikosList") {
    return OikosListBlock;
  }

  if (type === "videoEmbed") {
    return VideoBlock;
  }

  if (type === "biblePassage") {
    return BiblePassageBlock;
  }

  if (type === "lastTime") {
    return LastTimeBlock;
  }

  return null;
}
</script>

<template>
  <div class="editorjs-content">
    <component
      :is="resolveBlockComponent(block.type)"
      v-for="(block, index) in content.blocks || []"
      :key="index"
      :data="block.data"
    />
  </div>
</template>