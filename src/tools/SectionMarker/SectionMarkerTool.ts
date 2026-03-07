import type { BlockTool, ToolConfig } from "@editorjs/editorjs";
import { getCurrentLanguage } from "../../i18n/languageState";
import "./SectionMarkerTool.css";
import { t } from "../../i18n";

type SectionTheme = "back" | "up" | "forward";

interface SectionMarkerData {
  theme: SectionTheme;
}

interface SectionOption {
  value: SectionTheme;
  labelKey: string;
}

const SECTION_OPTIONS: SectionOption[] = [
  { value: "back", labelKey: "sectionMarker.lookBack" },
  { value: "up", labelKey: "sectionMarker.lookUp" },
  { value: "forward", labelKey: "sectionMarker.lookForward" },
];

export default class SectionMarkerTool implements BlockTool {
  private data: SectionMarkerData;
  private wrapper: HTMLDivElement | null;
  private selectEl: HTMLSelectElement | null;
  private previewEl: HTMLDivElement | null;

  public static get toolbox(): ToolConfig {
    return {
      title: "Section Marker",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6h16"></path>
        <path d="M4 12h10"></path>
        <path d="M4 18h16"></path>
      </svg>`,
    };
  }

  public constructor({
    data,
  }: {
    data?: Partial<SectionMarkerData>;
  }) {
    this.data = {
      theme: data?.theme ?? "back",
    };

    this.wrapper = null;
    this.selectEl = null;
    this.previewEl = null;
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "section-marker-tool";

    this.selectEl = document.createElement("select");
    this.selectEl.className = "section-marker-tool__select";

    const lang = getCurrentLanguage();

    SECTION_OPTIONS.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option.value;
      optionEl.textContent = t(lang, option.labelKey);

      if (option.value === this.data.theme) {
        optionEl.selected = true;
      }

      this.selectEl?.appendChild(optionEl);
    });

    this.previewEl = document.createElement("div");
    this.previewEl.className = "section-marker-tool__preview";

    this.selectEl.addEventListener("change", () => {
      this.data.theme = this.selectEl?.value as SectionTheme;
      this.updatePreview();
    });

    this.wrapper.appendChild(this.selectEl);
    this.wrapper.appendChild(this.previewEl);

    this.updatePreview();

    return this.wrapper;
  }

  private updatePreview(): void {
    if (!this.previewEl) {
      return;
    }

    const lang = getCurrentLanguage();
    let label = "";

    if (this.data.theme === "back") {
      label = t(lang, "sectionMarker.lookBack");
    } else if (this.data.theme === "up") {
      label = t(lang, "sectionMarker.lookUp");
    } else {
      label = t(lang, "sectionMarker.lookForward");
    }

    this.previewEl.textContent = label;
  }

  public save(): SectionMarkerData {
    return {
      theme: this.selectEl?.value as SectionTheme || "back",
    };
  }
}