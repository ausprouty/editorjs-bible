import type { OutputData } from "@editorjs/editorjs";

export interface LessonTemplate {
  key: string;
  label: string;
  build(): OutputData;
}