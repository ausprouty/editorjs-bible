type BiblePassageToolConfig = {
  endpointBase?: string;
};

type BiblePassageToolData = {
  reference: string;
  passage: string;
};

type EditorJSToolConstructorArgs = {
  data: Partial<BiblePassageToolData>;
  api: unknown;
  config?: BiblePassageToolConfig;
  readOnly?: boolean;
};

export default class BiblePassageTool {
  public static get toolbox() {
    return {
      title: "Bible Passage",
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3h9a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2zm0 2v12h10V6a1 1 0 0 0-1-1H6zm2 3h6v2H8V8zm0 4h6v2H8v-2z"/>
        </svg>
      `,
    };
  }

  public static get isReadOnlySupported() {
    return true;
  }

  public static get sanitize() {
    return {
      reference: {},
      passage: { br: true },
    };
  }

  private readonly readOnly: boolean;
  private readonly config: BiblePassageToolConfig;

  private data: BiblePassageToolData;

  private wrapper: HTMLDivElement | null = null;
  private referenceInput: HTMLInputElement | null = null;
  private fetchButton: HTMLButtonElement | null = null;
  private statusEl: HTMLDivElement | null = null;
  private passageEl: HTMLDivElement | null = null;

  public constructor(args: EditorJSToolConstructorArgs) {
    this.readOnly = Boolean(args.readOnly);
    this.config = args.config || {};

    this.data = {
      reference: args.data?.reference ? String(args.data.reference) : "",
      passage: args.data?.passage ? String(args.data.passage) : "",
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "bible-passage-tool";

    const controls = document.createElement("div");
    controls.className = "bible-passage-tool__controls";

    this.referenceInput = document.createElement("input");
    this.referenceInput.type = "text";
    this.referenceInput.placeholder = "Enter Bible reference, e.g. John 3:16-17";
    this.referenceInput.value = this.data.reference;
    this.referenceInput.className = "bible-passage-tool__input";
    this.referenceInput.disabled = this.readOnly;

    this.fetchButton = document.createElement("button");
    this.fetchButton.type = "button";
    this.fetchButton.textContent = "Fetch passage";
    this.fetchButton.className = "bible-passage-tool__button";
    this.fetchButton.disabled = this.readOnly;

    this.statusEl = document.createElement("div");
    this.statusEl.className = "bible-passage-tool__status";

    this.passageEl = document.createElement("div");
    this.passageEl.className = "bible-passage-tool__passage";

    if (this.data.passage) {
      this.passageEl.innerHTML = this.escapeHtml(this.data.passage).replace(
        /\n/g,
        "<br>",
      );
    }

    if (!this.readOnly) {
      this.fetchButton.addEventListener("click", () => {
        void this.fetchPassage();
      });

      this.referenceInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void this.fetchPassage();
        }
      });
    }

    controls.appendChild(this.referenceInput);
    controls.appendChild(this.fetchButton);

    this.wrapper.appendChild(controls);
    this.wrapper.appendChild(this.statusEl);
    this.wrapper.appendChild(this.passageEl);

    return this.wrapper;
  }

  private async fetchPassage(): Promise<void> {
    const reference = this.referenceInput
      ? this.referenceInput.value.trim()
      : this.data.reference.trim();

    if (!reference) {
      this.setStatus("Please enter a Bible reference.", "error");
      return;
    }

    this.setLoading(true);
    this.setStatus("Loading passage...", "info");

    try {
      const endpointBase =
        this.config.endpointBase ??
        "https://api.mylanguage.net.au/api/passage/en/";

      const url = endpointBase + encodeURIComponent(reference);

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json, text/plain, */*" },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      let passageText = "";

      if (contentType.includes("application/json")) {
        const json: unknown = await response.json();
        passageText = this.extractPassageFromJson(json);
      } else {
        passageText = await response.text();
      }

      passageText = passageText.trim();
      if (!passageText) {
        throw new Error("No passage text returned from API");
      }

      this.data.reference = reference;
      this.data.passage = passageText;

      if (this.passageEl) {
        this.passageEl.innerHTML = this.escapeHtml(this.data.passage).replace(
          /\n/g,
          "<br>",
        );
      }

      this.setStatus("Passage loaded.", "success");
    } catch (err) {
      console.error("Bible passage fetch failed:", err);
      this.setStatus(
        "Could not load passage. Check the reference and API response.",
        "error",
      );
    } finally {
      this.setLoading(false);
    }
  }

  private extractPassageFromJson(json: unknown): string {
    if (!json) return "";

    if (typeof json === "string") return json;

    if (typeof json === "object" && json !== null) {
      const obj = json as Record<string, unknown>;

      const passage = obj["passage"];
      if (typeof passage === "string") return passage;

      const text = obj["text"];
      if (typeof text === "string") return text;

      const content = obj["content"];
      if (typeof content === "string") return content;

      const verses = obj["verses"];
      if (Array.isArray(verses)) {
        const lines: string[] = [];
        for (const v of verses) {
          if (typeof v === "string") {
            lines.push(v);
            continue;
          }
          if (typeof v === "object" && v !== null) {
            const verseObj = v as Record<string, unknown>;
            const vt = verseObj["text"];
            const vn = verseObj["verse"];
            if (typeof vt === "string" && typeof vn !== "undefined") {
              lines.push(`${String(vn)}. ${vt}`);
            } else if (typeof vt === "string") {
              lines.push(vt);
            }
          }
        }
        return lines.filter(Boolean).join("\n");
      }

      // Fallback: stringify unknown shape for debugging
      try {
        return JSON.stringify(obj, null, 2);
      } catch {
        return "";
      }
    }

    return "";
  }

  public save(): BiblePassageToolData {
    const ref = this.referenceInput
      ? this.referenceInput.value.trim()
      : this.data.reference;

    return {
      reference: ref,
      passage: this.data.passage || "",
    };
  }

  public validate(savedData: BiblePassageToolData): boolean {
    return Boolean(savedData.reference && savedData.reference.trim());
  }

  private setLoading(isLoading: boolean): void {
    if (this.fetchButton) {
      this.fetchButton.disabled = isLoading || this.readOnly;
      this.fetchButton.textContent = isLoading ? "Loading..." : "Fetch passage";
    }
    if (this.referenceInput) {
      this.referenceInput.disabled = isLoading || this.readOnly;
    }
  }

  private setStatus(message: string, type: string): void {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    this.statusEl.dataset.state = type;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}