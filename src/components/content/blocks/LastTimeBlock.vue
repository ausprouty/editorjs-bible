<script setup>
import { computed } from "vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  currentIndex: {
    type: Number,
    required: true,
  },
  sessions: {
    type: Array,
    required: true,
  },
  reminderText: {
    type: String,
    default: "",
  },
});

const previousLookForward = computed(() => {
  if (!Array.isArray(props.sessions)) {
    return "";
  }

  if (props.currentIndex <= 0) {
    return "";
  }

  const previousSession = props.sessions[props.currentIndex - 1];

  if (!previousSession) {
    return "";
  }

  return previousSession.lookForward || "";
});
</script>

<template>
  <section
    v-if="previousLookForward"
    class="last-time-block"
  >
    <div class="last-time-block__intro">
      {{ reminderText }}
    </div>

    <div class="last-time-block__content">
      {{ previousLookForward }}
    </div>
  </section>
</template>

<style scoped>
.last-time-block {
  padding: 1rem;
  border-radius: 10px;
  background: #f6f6f6;
  margin: 1rem 0;
}

.last-time-block__intro {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.last-time-block__content {
  white-space: pre-wrap;
}
</style>