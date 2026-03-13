<script setup>
import { computed } from "vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const tagName = computed(function () {
  return props.data && props.data.style === "ordered"
    ? "ol"
    : "ul";
});

const items = computed(function () {
  return Array.isArray(props.data && props.data.items)
    ? props.data.items
    : [];
});

function hasChildren(item) {
  return Boolean(
    item &&
    Array.isArray(item.items) &&
    item.items.length,
  );
}

function itemContent(item) {
  if (typeof item === "string") {
    return item;
  }

  if (item && typeof item.content === "string") {
    return item.content;
  }

  return "";
}

function itemChildren(item) {
  if (item && Array.isArray(item.items)) {
    return item.items;
  }

  return [];
}
</script>

<template>
  <component
    :is="tagName"
    v-if="items.length"
    class="list-block"
  >
    <template
      v-for="(item, index) in items"
      :key="index"
    >
      <li class="list-block__item">
        <span v-html="itemContent(item)" />

        <component
          :is="tagName"
          v-if="hasChildren(item)"
          class="list-block list-block--nested"
        >
          <li
            v-for="(child, childIndex) in itemChildren(item)"
            :key="childIndex"
            class="list-block__item"
          >
            <span v-html="itemContent(child)" />

            <component
              :is="tagName"
              v-if="hasChildren(child)"
              class="list-block list-block--nested"
            >
              <li
                v-for="(grandChild, grandChildIndex) in itemChildren(child)"
                :key="grandChildIndex"
                class="list-block__item"
              >
                <span v-html="itemContent(grandChild)" />
              </li>
            </component>
          </li>
        </component>
      </li>
    </template>
  </component>
</template>

<style scoped>
.list-block {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.list-block__item {
  margin: 0.4rem 0;
  line-height: 1.5;
}

.list-block--nested {
  margin-top: 0.4rem;
}
</style>