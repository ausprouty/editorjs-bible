<script setup>
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

function tagName(level) {
  if (level === 1) {
    return "h1";
  }
  if (level === 2) {
    return "h2";
  }
  if (level === 3) {
    return "h3";
  }
  if (level === 4) {
    return "h4";
  }
  return "h2";
}
</script>

<template>
  <component
    :is="tagName(data.level)"
    class="header-block"
    v-html="data.text || ''"
  />
</template>