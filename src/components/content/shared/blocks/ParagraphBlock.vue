<script setup>
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <p
    class="paragraph-block"
    v-html="data.text || ''"
  />
</template>