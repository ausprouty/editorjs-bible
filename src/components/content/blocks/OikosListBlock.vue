<script setup>
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="oikos-list-block">
    <h3 v-if="data.title" class="oikos-list-block__title">
      {{ data.title }}
    </h3>

    <div
      v-for="(item, index) in data.items || []"
      :key="index"
      class="oikos-list-block__item"
    >
      <div
        v-if="item.name"
        class="oikos-list-block__name"
      >
        {{ item.name }}
      </div>

      <div
        v-if="item.relationship"
        class="oikos-list-block__relationship"
      >
        {{ item.relationship }}
      </div>

      <div
        v-if="item.notes"
        class="oikos-list-block__notes"
      >
        {{ item.notes }}
      </div>
    </div>
  </section>
</template>

<style scoped>
.oikos-list-block {
  margin: 1rem 0;
}

.oikos-list-block__title {
  margin-bottom: 0.75rem;
}

.oikos-list-block__item {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.oikos-list-block__name {
  font-weight: 700;
}

.oikos-list-block__relationship {
  color: #666;
  margin-top: 0.25rem;
}

.oikos-list-block__notes {
  margin-top: 0.5rem;
  white-space: pre-wrap;
}
</style>