import "./VideoTool.css";

type VideoSource = "arclight" | "youtube" | "vimeo" | "";

type VideoToolData = {
  title: string;
  url: string;
  source: VideoSource;
  refId: string;
  startTime: string;
  endTime: string;
  isOpen?: boolean;
};

type VideoToolLabels = {
  untitledVideo?: string;
  watchOnlineTemplate?: string;
  titleLabel?: string;
  urlLabel?: string;
  startLabel?: string;
  endLabel?: string;
  previewUnavailable?: string;
};

type VideoToolConfig = {
  labels?: VideoToolLabels;
};

type EditorJSToolConstructorArgs = {
  data: Partial<VideoToolData>;
  api: unknown;
  config?: VideoToolConfig;
  readOnly?: boolean;
};

export default class VideoTool {
  private data: VideoToolData;
  private readOnly: boolean;
  private config?: VideoToolConfig;

  private wrapper!: HTMLDivElement;
  private header!: HTMLButtonElement;
  private body!: HTMLDivElement;
  private statusLine!: HTMLDivElement;
  private previewArea!: HTMLDivElement;

  private titleInput!: HTMLInputElement;
  private urlInput!: HTMLInputElement;
  private startInput!: HTMLInputElement;
  private endInput!: HTMLInputElement;

  public static get toolbox() {
    return {
      title: "Video",
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 6h8a2 2 0 0 1 2 2v1.5l3-2v9l-3-2V16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
            fill="currentColor"
          />
        </svg>
      `,
    };
  }

  public static get isReadOnlySupported(): boolean {
    return true;
  }

  constructor({
    data,
    config,
    readOnly,
  }: EditorJSToolConstructorArgs) {
    this.readOnly = Boolean(readOnly);
    this.config = config;

    this.data = {
      title: data.title || "",
      url: data.url || "",
      source: data.source || "",
      refId: data.refId || "",
      startTime: data.startTime || "",
      endTime: data.endTime || "",
      isOpen: data.isOpen ?? true,
    };

    if (this.data.url && !this.data.source) {
      const detected = this.detectSourceFromUrl(this.data.url);
      this.data.source = detected.source;
      this.data.refId = detected.refId;
    }
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "video-tool";

    this.header = document.createElement("button");
    this.header.type = "button";
    this.header.className = "video-tool__header";
    this.header.addEventListener("click", this.onToggleHeader);

    this.body = document.createElement("div");
    this.body.className = "video-tool__body";

    this.statusLine = document.createElement("div");
    this.statusLine.className = "video-tool__status";

    const fields = document.createElement("div");
    fields.className = "video-tool__fields";

    this.titleInput = this.createInput({
      label: this.label("titleLabel", "Title"),
      value: this.data.title,
      placeholder: this.label("untitledVideo", "Untitled video"),
      readOnly: this.readOnly,
      onInput: () => {
        this.data.title = this.titleInput.value.trim();
        this.refreshHeader();
      },
    });

    this.urlInput = this.createInput({
      label: this.label("urlLabel", "Video URL"),
      value: this.data.url,
      placeholder: "https://api.arclight.org/videoPlayerUrl?refId=...",
      readOnly: this.readOnly,
      onInput: () => {
        this.data.url = this.urlInput.value.trim();
        this.updateDetectedVideoInfo();
        this.refreshHeader();
        this.refreshPreview();
      },
    });

    this.startInput = this.createInput({
      label: this.label("startLabel", "Start time"),
      value: this.data.startTime,
      placeholder: "start or 4:41",
      readOnly: this.readOnly,
      onInput: () => {
        this.data.startTime = this.startInput.value.trim();
        this.refreshPreview();
      },
    });

    this.endInput = this.createInput({
      label: this.label("endLabel", "End time"),
      value: this.data.endTime,
      placeholder: "5:10",
      readOnly: this.readOnly,
      onInput: () => {
        this.data.endTime = this.endInput.value.trim();
        this.refreshPreview();
      },
    });

    fields.appendChild(this.wrapField(this.titleInput));
    fields.appendChild(this.wrapField(this.urlInput));
    fields.appendChild(this.wrapField(this.startInput));
    fields.appendChild(this.wrapField(this.endInput));

    this.previewArea = document.createElement("div");
    this.previewArea.className = "video-tool__preview";

    this.body.appendChild(this.statusLine);
    this.body.appendChild(fields);
    this.body.appendChild(this.previewArea);

    this.wrapper.appendChild(this.header);
    this.wrapper.appendChild(this.body);

    this.refreshHeader();
    this.refreshBodyOpenState();
    this.refreshPreview();

    return this.wrapper;
  }

  public save(): VideoToolData {
    this.updateDetectedVideoInfo();

    return {
      title: this.titleInput.value.trim(),
      url: this.urlInput.value.trim(),
      source: this.data.source,
      refId: this.data.refId,
      startTime: this.startInput.value.trim(),
      endTime: this.endInput.value.trim(),
      isOpen: this.data.isOpen ?? true,
    };
  }

  public validate(savedData: VideoToolData): boolean {
    return Boolean(savedData.url || savedData.refId);
  }

  private onToggleHeader = (): void => {
    this.data.isOpen = !this.data.isOpen;
    this.refreshBodyOpenState();
    this.refreshHeader();
  };

  private refreshBodyOpenState(): void {
    if (this.data.isOpen) {
      this.wrapper.classList.add("video-tool--open");
      this.body.style.display = "block";
      return;
    }

    this.wrapper.classList.remove("video-tool--open");
    this.body.style.display = "none";
  }

  private refreshHeader(): void {
    const title = this.data.title || this.label(
      "untitledVideo",
      "Untitled video"
    );

    const watchTemplate = this.label(
      "watchOnlineTemplate",
      "Watch {title} online"
    );

    const watchText = this.interpolate(watchTemplate, {
      title,
    });

    this.header.innerHTML = `
      <span class="video-tool__chevron" aria-hidden="true">
        ${this.data.isOpen ? "▾" : "▸"}
      </span>
      <span class="video-tool__header-text">${this.escapeHtml(watchText)}</span>
    `;
  }

  private refreshPreview(): void {
    this.previewArea.innerHTML = "";
    this.statusLine.innerHTML = "";

    const iframeUrl = this.buildEmbedUrl();

    const metaBits: string[] = [];

    if (this.data.source) {
      metaBits.push(`source: ${this.data.source}`);
    }

    if (this.data.refId) {
      metaBits.push(`refId: ${this.data.refId}`);
    }

    this.statusLine.textContent = metaBits.join("   ");

    if (!iframeUrl) {
      const note = document.createElement("div");
      note.className = "video-tool__preview-unavailable";
      note.textContent = this.label(
        "previewUnavailable",
        "Preview unavailable until the video URL is recognised."
      );
      this.previewArea.appendChild(note);
      return;
    }

    if (this.data.source === "arclight") {
      const arcCont = document.createElement("div");
      arcCont.className = "arc-cont";

      const iframe = document.createElement("iframe");
      iframe.src = iframeUrl;
      iframe.allowFullscreen = true;
      iframe.setAttribute("webkitallowfullscreen", "true");
      iframe.setAttribute("mozallowfullscreen", "true");

      arcCont.appendChild(iframe);
      this.previewArea.appendChild(arcCont);
      return;
    }

    const genericFrameWrap = document.createElement("div");
    genericFrameWrap.className = "video-tool__iframe-wrap";

    const iframe = document.createElement("iframe");
    iframe.src = iframeUrl;
    iframe.allowFullscreen = true;
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

    genericFrameWrap.appendChild(iframe);
    this.previewArea.appendChild(genericFrameWrap);
  }

  private updateDetectedVideoInfo(): void {
    const detected = this.detectSourceFromUrl(this.data.url);

    this.data.source = detected.source;
    this.data.refId = detected.refId;
  }

  private detectSourceFromUrl(
    rawUrl: string
  ): { source: VideoSource; refId: string } {
    const trimmed = rawUrl.trim();

    if (!trimmed) {
      return {
        source: "",
        refId: "",
      };
    }

    try {
      const url = new URL(trimmed);
      const hostname = url.hostname.toLowerCase();

      if (
        hostname.includes("api.arclight.org") ||
        hostname.includes("arclight.org")
      ) {
        const refId = url.searchParams.get("refId") || "";
        return {
          source: refId ? "arclight" : "",
          refId,
        };
      }

      if (hostname.includes("youtube.com")) {
        const videoId = url.searchParams.get("v") || "";
        return {
          source: videoId ? "youtube" : "",
          refId: videoId,
        };
      }

      if (hostname.includes("youtu.be")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const videoId = parts[0] || "";
        return {
          source: videoId ? "youtube" : "",
          refId: videoId,
        };
      }

      if (hostname.includes("vimeo.com")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const videoId = parts[parts.length - 1] || "";
        return {
          source: videoId ? "vimeo" : "",
          refId: videoId,
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

  private buildEmbedUrl(): string {
    if (!this.data.source || !this.data.refId) {
      return "";
    }

    if (this.data.source === "arclight") {
      const url = new URL("https://api.arclight.org/videoPlayerUrl");
      url.searchParams.set("refId", this.data.refId);

      const start = this.parseTimeToSeconds(this.data.startTime);
      const end = this.parseTimeToSeconds(this.data.endTime);

      if (start !== null) {
        url.searchParams.set("start", String(start));
      }

      if (end !== null) {
        url.searchParams.set("end", String(end));
      }

      return url.toString();
    }

    if (this.data.source === "youtube") {
      const url = new URL(
        `https://www.youtube.com/embed/${encodeURIComponent(this.data.refId)}`
      );

      const start = this.parseTimeToSeconds(this.data.startTime);
      const end = this.parseTimeToSeconds(this.data.endTime);

      if (start !== null) {
        url.searchParams.set("start", String(start));
      }

      if (end !== null) {
        url.searchParams.set("end", String(end));
      }

      return url.toString();
    }

    if (this.data.source === "vimeo") {
      const url = new URL(
        `https://player.vimeo.com/video/${encodeURIComponent(this.data.refId)}`
      );

      const start = this.parseTimeToSeconds(this.data.startTime);

      if (start !== null) {
        url.searchParams.set("#t", `${start}s`);
      }

      return url.toString();
    }

    return "";
  }

  private parseTimeToSeconds(value: string): number | null {
    const raw = value.trim().toLowerCase();

    if (!raw) {
      return null;
    }

    if (raw === "start") {
      return 0;
    }

    if (/^\d+$/.test(raw)) {
      return Number(raw);
    }

    const parts = raw.split(":").map((part) => part.trim());

    if (!parts.every((part) => /^\d+$/.test(part))) {
      return null;
    }

    if (parts.length === 2) {
      const minutes = Number(parts[0]);
      const seconds = Number(parts[1]);
      return minutes * 60 + seconds;
    }

    if (parts.length === 3) {
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      const seconds = Number(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    }

    return null;
  }

  private createInput({
    label,
    value,
    placeholder,
    readOnly,
    onInput,
  }: {
    label: string;
    value: string;
    placeholder: string;
    readOnly: boolean;
    onInput: () => void;
  }): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "video-tool__input";
    input.value = value;
    input.placeholder = placeholder;
    input.readOnly = readOnly;
    input.setAttribute("aria-label", label);
    input.addEventListener("input", onInput);

    return input;
  }

  private wrapField(input: HTMLInputElement): HTMLLabelElement {
    const field = document.createElement("label");
    field.className = "video-tool__field";

    const label = document.createElement("span");
    label.className = "video-tool__field-label";
    label.textContent = input.getAttribute("aria-label") || "";

    field.appendChild(label);
    field.appendChild(input);

    return field;
  }

  private label(
    key: keyof VideoToolLabels,
    fallback: string
  ): string {
    const value = this.config?.labels?.[key];
    return value || fallback;
  }

  private interpolate(
    template: string,
    values: Record<string, string>
  ): string {
    return template.replace(
      /\{(\w+)\}/g,
      (match: string, key: string): string => {
        return Object.prototype.hasOwnProperty.call(values, key)
          ? values[key]
          : match;
      }
    );
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}