<script setup>
import { computed, ref, watch } from "vue";
import "../shared/blockHeader.css";
import "./VideoBlock.css";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  labels: {
    type: Object,
    default: () => ({}),
  },
});

const isOpen = ref(
  typeof props.data.isOpen === "boolean"
    ? props.data.isOpen
    : true,
);

watch(
  function () {
    return props.data && props.data.isOpen;
  },
  function (value) {
    if (typeof value === "boolean") {
      isOpen.value = value;
    }
  },
);

function label(key, fallback) {
  return props.labels && props.labels[key]
    ? props.labels[key]
    : fallback;
}

function interpolate(template, values) {
  return String(template).replace(
    /\{(\w+)\}/g,
    function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : match;
    },
  );
}

function parseTimeToSeconds(value) {
  var raw = String(value || "").trim().toLowerCase();

  if (!raw) {
    return null;
  }

  if (raw === "start") {
    return 0;
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  var parts = raw.split(":").map(function (part) {
    return part.trim();
  });

  if (
    !parts.every(function (part) {
      return /^\d+$/.test(part);
    })
  ) {
    return null;
  }

  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  if (parts.length === 3) {
    return (
      Number(parts[0]) * 3600 +
      Number(parts[1]) * 60 +
      Number(parts[2])
    );
  }

  return null;
}

function detectSourceFromUrl(rawUrl) {
  var trimmed = String(rawUrl || "").trim();

  if (!trimmed) {
    return {
      source: "",
      refId: "",
    };
  }

  try {
    var url = new URL(trimmed);
    var hostname = url.hostname.toLowerCase();

    if (
      hostname.includes("api.arclight.org") ||
      hostname.includes("arclight.org")
    ) {
      var arcRefId = url.searchParams.get("refId") || "";
      return {
        source: arcRefId ? "arclight" : "",
        refId: arcRefId,
      };
    }

    if (hostname.includes("youtube.com")) {
      var videoId = url.searchParams.get("v") || "";
      return {
        source: videoId ? "youtube" : "",
        refId: videoId,
      };
    }

    if (hostname.includes("youtu.be")) {
      var ytParts = url.pathname.split("/").filter(Boolean);
      var shortId = ytParts[0] || "";
      return {
        source: shortId ? "youtube" : "",
        refId: shortId,
      };
    }

    if (hostname.includes("vimeo.com")) {
      var vmParts = url.pathname.split("/").filter(Boolean);
      var vimeoId = vmParts[vmParts.length - 1] || "";
      return {
        source: vimeoId ? "vimeo" : "",
        refId: vimeoId,
      };
    }
  } catch (_error) {
    return {
      source: "",
      refId: "",
    };
  }

  return {
    source: "",
    refId: "",
  };
}

const resolvedVideo = computed(function () {
  var source = props.data && props.data.source
    ? props.data.source
    : "";
  var refId = props.data && props.data.refId
    ? props.data.refId
    : "";

  if (!source && props.data && props.data.url) {
    var detected = detectSourceFromUrl(props.data.url);
    source = detected.source;
    refId = detected.refId;
  }

  return {
    source: source,
    refId: refId,
  };
});

const displayTitle = computed(function () {
  return props.data && props.data.title
    ? props.data.title
    : label("untitledVideo", "Untitled video");
});

const summaryText = computed(function () {
  var template = label(
    "watchOnlineTemplate",
    "Watch {title} online",
  );

  if (!template || template === "watchOnlineTemplate") {
    template = "Watch {title} online";
  }

  if (template.indexOf("{title}") === -1) {
    return (template + " " + displayTitle.value).trim();
  }

  return interpolate(template, {
    title: displayTitle.value,
  });
});

const embedUrl = computed(function () {
  var source = resolvedVideo.value.source;
  var refId = resolvedVideo.value.refId;

  if (!source || !refId) {
    return "";
  }

  var start = parseTimeToSeconds(
    props.data && props.data.startTime
      ? props.data.startTime
      : "",
  );

  var end = parseTimeToSeconds(
    props.data && props.data.endTime
      ? props.data.endTime
      : "",
  );

  if (source === "arclight") {
    var arcUrl = new URL("https://api.arclight.org/videoPlayerUrl");
    arcUrl.searchParams.set("refId", refId);

    if (start !== null) {
      arcUrl.searchParams.set("start", String(start));
    }

    if (end !== null) {
      arcUrl.searchParams.set("end", String(end));
    }

    return arcUrl.toString();
  }

  if (source === "youtube") {
    var ytUrl = new URL(
      "https://www.youtube.com/embed/" +
      encodeURIComponent(refId),
    );

    if (start !== null) {
      ytUrl.searchParams.set("start", String(start));
    }

    if (end !== null) {
      ytUrl.searchParams.set("end", String(end));
    }

    return ytUrl.toString();
  }

  if (source === "vimeo") {
    var baseUrl =
      "https://player.vimeo.com/video/" +
      encodeURIComponent(refId);

    if (start !== null) {
      return baseUrl + "#t=" + String(start) + "s";
    }

    return baseUrl;
  }

  return "";
});

function toggleOpen() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <section
    class="video-block"
    :class="{ 'video-block--open': isOpen }"
  >
    <button
      type="button"
      class="video-block__header tool-header"
      :data-open="isOpen ? 'true' : 'false'"
      @click="toggleOpen"
    >
      <span class="tool-header__left">
        <span
          class="tool-header__icon"
          aria-hidden="true"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M8 6h8a2 2 0 0 1 2 2v1.5l3-2v9l-3-2V16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <span class="tool-header__text">
          {{ summaryText }}
        </span>
      </span>

      <span class="tool-header__right">
        <span
          class="tool-header__toggle"
          aria-hidden="true"
        >
          {{ isOpen ? "−" : "+" }}
        </span>
      </span>
    </button>

    <div
      v-show="isOpen"
      class="video-block__body"
    >
      <div
        v-if="embedUrl"
        class="video-block__preview"
      >
        <div
          v-if="resolvedVideo.source === 'arclight'"
          class="arc-cont"
        >
          <iframe
            :src="embedUrl"
            allowfullscreen
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div
          v-else
          class="video-block__iframe-wrap"
        >
          <iframe
            :src="embedUrl"
            allowfullscreen
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      <div
        v-else
        class="video-block__preview-unavailable"
      >
        {{
          label(
            "previewUnavailable",
            "Preview unavailable until the video URL is recognised.",
          )
        }}
      </div>
    </div>
  </section>
</template>

<style scoped>
.video-block {
  margin: 1rem 0;
}

.video-block__header {
  width: 100%;
  background: transparent;
  border: 0;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.video-block__body {
  margin-top: 0.75rem;
}

.video-block__iframe-wrap,
.arc-cont {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
}

.video-block__iframe-wrap {
  aspect-ratio: 16 / 9;
}

.arc-cont {
  aspect-ratio: 16 / 9;
}

.video-block__iframe-wrap iframe,
.arc-cont iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.video-block__preview-unavailable {
  padding: 1rem;
  border-radius: 10px;
  background: #f6f6f6;
}
</style>