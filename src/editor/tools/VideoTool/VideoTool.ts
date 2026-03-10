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
  isEditing?: boolean;
};

type VideoToolLabels = {
  untitledVideo?: string;
  watchOnlineTemplate?: string;
  titleLabel?: string;
  urlLabel?: string;
  startLabel?: string;
  endLabel?: string;
  previewUnavailable?: string;
  editLabel?: string;
  doneLabel?: string;
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
  private header!: HTMLDivElement;
  private body!: HTMLDivElement;
  private formArea!: HTMLDivElement;
  private previewArea!: HTMLDivElement;
  private statusLine!: HTMLDivElement;

  private toggleButton!: HTMLButtonElement;
  private summaryText!: HTMLSpanElement;
  private editButton!: HTMLButtonElement;

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
      isEditing: data.isEditing ?? true,
    };

    if (this.data.url && !this.data.source) {
      this.updateDetectedVideoInfo();
    }
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "video-tool";

    this.renderHeader();
    this.renderBody();

    this.wrapper.appendChild(this.header);
    this.wrapper.appendChild(this.body);

    this.refreshAll();

    return this.wrapper;
  }

  public save(): VideoToolData {
    this.syncDataFromInputs();
    this.updateDetectedVideoInfo();

    return {
      title: this.data.title,
      url: this.data.url,
      source: this.data.source,
      refId: this.data.refId,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      isOpen: this.data.isOpen ?? true,
      isEditing: this.data.isEditing ?? false,
    };
  }

  public validate(savedData: VideoToolData): boolean {
    return Boolean(savedData.url || savedData.refId);
  }

  private renderHeader(): void {
    this.header = document.createElement("div");
    this.header.className = "video-tool__header";

    const left = document.createElement("div");
    left.className = "video-tool__header-left";

    this.toggleButton = document.createElement("button");
    this.toggleButton.type = "button";
    this.toggleButton.className = "video-tool__toggle";
    this.toggleButton.addEventListener("click", this.onToggleHeader);

    const icon = document.createElement("span");
    icon.className = "video-tool__header-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 6h8a2 2 0 0 1 2 2v1.5l3-2v9l-3-2V16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
          fill="currentColor"
        />
      </svg>
    `;

    this.summaryText = document.createElement("span");
    this.summaryText.className = "video-tool__header-text";

    left.appendChild(this.toggleButton);
    left.appendChild(icon);
    left.appendChild(this.summaryText);

    const right = document.createElement("div");
    right.className = "video-tool__header-right";

    this.editButton = document.createElement("button");
    this.editButton.type = "button";
    this.editButton.className = "video-tool__edit";
    this.editButton.addEventListener("click", this.onEditClick);

    const plus = document.createElement("span");
    plus.className = "video-tool__plus";
    plus.setAttribute("aria-hidden", "true");
    plus.textContent = "+";

    right.appendChild(this.editButton);
    right.appendChild(plus);

    this.header.appendChild(left);
    this.header.appendChild(right);
  }

  private renderBody(): void {
    this.body = document.createElement("div");
    this.body.className = "video-tool__body";

    this.formArea = document.createElement("div");
    this.formArea.className = "video-tool__form-area";

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
        this.refreshHeaderText();
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
        this.refreshHeaderText();
        this.refreshStatusLine();
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
        this.refreshStatusLine();
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
        this.refreshStatusLine();
        this.refreshPreview();
      },
    });

    fields.appendChild(this.wrapField(this.titleInput));
    fields.appendChild(this.wrapField(this.urlInput));
    fields.appendChild(this.wrapField(this.startInput));
    fields.appendChild(this.wrapField(this.endInput));

    this.formArea.appendChild(this.statusLine);
    this.formArea.appendChild(fields);

    this.previewArea = document.createElement("div");
    this.previewArea.className = "video-tool__preview";

    this.body.appendChild(this.formArea);
    this.body.appendChild(this.previewArea);
  }

  private onToggleHeader = (): void => {
    if (this.data.isOpen) {
      this.data.isOpen = false;
    } else {
      this.data.isOpen = true;
      this.data.isEditing = false;
    }

    this.refreshAll();
  };

  private onEditClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    if (this.readOnly) {
      return;
    }

    if (this.data.isEditing) {
      this.syncDataFromInputs();
      this.updateDetectedVideoInfo();
      this.data.isEditing = false;
      this.data.isOpen = false;
    } else {
      this.data.isEditing = true;
      this.data.isOpen = true;
    }

    this.refreshAll();
  };

  private refreshAll(): void {
    this.refreshHeader();
    this.refreshBody();
  }

  private refreshHeader(): void {
    this.refreshHeaderText();
    this.refreshHeaderButtons();
  }

  private refreshHeaderText(): void {
    const title = this.data.title || this.label(
      "untitledVideo",
      "Untitled video"
    );

    const template = this.label(
      "watchOnlineTemplate",
      "Watch {title} online"
    );

    this.summaryText.textContent = this.interpolate(template, {
      title,
    });
  }

  private refreshHeaderButtons(): void {
    this.toggleButton.innerHTML = `
      <span class="video-tool__chevron" aria-hidden="true">
        ${this.data.isOpen ? "▾" : "▸"}
      </span>
    `;

    if (this.readOnly) {
      this.editButton.style.display = "none";
      return;
    }

    this.editButton.style.display = "inline-block";
    this.editButton.textContent = this.data.isEditing
      ? this.label("doneLabel", "Done")
      : this.label("editLabel", "Edit");
  }

  private refreshBody(): void {
    if (!this.data.isOpen) {
      this.wrapper.classList.remove("video-tool--open");
      this.body.style.display = "none";
      return;
    }

    this.wrapper.classList.add("video-tool--open");
    this.body.style.display = "block";

    if (this.data.isEditing) {
      this.formArea.style.display = "block";
      this.previewArea.style.display = "none";
      this.refreshStatusLine();
      return;
    }

    this.formArea.style.display = "none";
    this.previewArea.style.display = "block";
    this.refreshPreview();
  }

  private refreshStatusLine(): void {
    const embedUrl = this.buildEmbedUrl();

    if (embedUrl) {
      this.statusLine.textContent = embedUrl;
      return;
    }

    const metaBits: string[] = [];

    if (this.data.source) {
      metaBits.push(`source: ${this.data.source}`);
    }

    if (this.data.refId) {
      metaBits.push(`refId: ${this.data.refId}`);
    }

    this.statusLine.textContent = metaBits.join("   ");
  }

  private refreshPreview(): void {
    this.previewArea.innerHTML = "";

    if (this.data.isEditing) {
      return;
    }

    const iframeUrl = this.buildEmbedUrl();

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
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute(
        "referrerpolicy",
        "strict-origin-when-cross-origin"
      );

      arcCont.appendChild(iframe);
      this.previewArea.appendChild(arcCont);
      return;
    }

    const genericWrap = document.createElement("div");
    genericWrap.className = "video-tool__iframe-wrap";

    const iframe = document.createElement("iframe");
    iframe.src = iframeUrl;
    iframe.allowFullscreen = true;
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute(
      "referrerpolicy",
      "strict-origin-when-cross-origin"
    );

    genericWrap.appendChild(iframe);
    this.previewArea.appendChild(genericWrap);
  }

  private syncDataFromInputs(): void {
    if (this.titleInput) {
      this.data.title = this.titleInput.value.trim();
    }

    if (this.urlInput) {
      this.data.url = this.urlInput.value.trim();
    }

    if (this.startInput) {
      this.data.startTime = this.startInput.value.trim();
    }

    if (this.endInput) {
      this.data.endTime = this.endInput.value.trim();
    }
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
      const baseUrl =
        `https://player.vimeo.com/video/` +
        `${encodeURIComponent(this.data.refId)}`;

      const start = this.parseTimeToSeconds(this.data.startTime);

      if (start !== null) {
        return `${baseUrl}#t=${start}s`;
      }

      return baseUrl;
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
    const labels = this.config && this.config.labels
      ? this.config.labels
      : undefined;

    if (!labels) {
      return fallback;
    }

    const value = labels[key];
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
}