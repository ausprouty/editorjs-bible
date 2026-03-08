import "./CollapsibleSectionTool.css";

type CollapsibleSectionData = {
  heading: string;
  isOpen: boolean;
  body: string;
};

type EditorJSToolConstructorArgs = {
  data?: Partial<CollapsibleSectionData>;
  api: any;
  config?: Record<string, unknown>;
  readOnly?: boolean;
};

export default class CollapsibleSectionTool {
  private data: CollapsibleSectionData;
  private readOnly: boolean;

  private wrapper!: HTMLDivElement;
  private headerRow!: HTMLDivElement;
  private toggleButton!: HTMLButtonElement;
  private headingInput!: HTMLInputElement;
  private bodyWrap!: HTMLDivElement;
  private bodyEditor!: HTMLDivElement;

  constructor({
    data,
    readOnly = false,
  }: EditorJSToolConstructorArgs) {
    this.readOnly = readOnly;

    this.data = {
      heading: data?.heading || "",
      isOpen: data?.isOpen ?? true,
      body: data?.body || "",
    };
  }

  public static get toolbox() {
    return {
      title: "Collapsible Section",
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h16v3H4V6zm0 9h16v3H4v-3z"
            fill="currentColor"
          />
        </svg>
      `,
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "collapsible-section";

    this.headerRow = document.createElement("div");
    this.headerRow.className = "collapsible-section__header";

    this.toggleButton = document.createElement("button");
    this.toggleButton.type = "button";
    this.toggleButton.className = "collapsible-section__toggle";
    this.toggleButton.setAttribute("aria-label", "Toggle section");
    this.toggleButton.disabled = this.readOnly;
    this.toggleButton.addEventListener("click", () => {
      this.data.isOpen = !this.data.isOpen;
      this.syncOpenState();
    });

    this.headingInput = document.createElement("input");
    this.headingInput.type = "text";
    this.headingInput.className = "collapsible-section__heading";
    this.headingInput.placeholder = "Section heading";
    this.headingInput.value = this.data.heading;
    this.headingInput.readOnly = this.readOnly;
    this.headingInput.addEventListener("input", () => {
      this.data.heading = this.headingInput.value;
    });

    this.bodyWrap = document.createElement("div");
    this.bodyWrap.className = "collapsible-section__body-wrap";

    this.bodyEditor = document.createElement("div");
    this.bodyEditor.className = "collapsible-section__body";
    this.bodyEditor.contentEditable = this.readOnly ? "false" : "true";
    this.bodyEditor.innerHTML = this.data.body || "";
    this.bodyEditor.addEventListener("input", () => {
      this.data.body = this.bodyEditor.innerHTML;
    });

    this.headerRow.appendChild(this.toggleButton);
    this.headerRow.appendChild(this.headingInput);
    this.bodyWrap.appendChild(this.bodyEditor);

    this.wrapper.appendChild(this.headerRow);
    this.wrapper.appendChild(this.bodyWrap);

    this.syncOpenState();

    return this.wrapper;
  }

  public save(): CollapsibleSectionData {
    return {
      heading: this.headingInput.value.trim(),
      isOpen: this.data.isOpen,
      body: this.bodyEditor.innerHTML,
    };
  }

  private syncOpenState(): void {
    this.toggleButton.textContent = this.data.isOpen ? "−" : "+";
    this.bodyWrap.style.display = this.data.isOpen ? "block" : "none";
    this.wrapper.dataset.open = this.data.isOpen ? "true" : "false";
  }

  public static get sanitize() {
    return {
      heading: {},
      isOpen: {},
      body: {
        br: true,
        p: true,
        b: true,
        strong: true,
        i: true,
        em: true,
        u: true,
        a: {
          href: true,
          target: true,
          rel: true,
        },
        ul: true,
        ol: true,
        li: true,
        blockquote: true,
      },
    };
  }
}