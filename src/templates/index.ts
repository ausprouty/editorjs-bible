import type { LessonTemplate } from "./types";
import { multiply1Template } from "../../public/templates/en/multiply1";

export const templates: LessonTemplate[] = [
  multiply1Template,
];

export function getTemplateByKey(
  key: string,
): LessonTemplate | undefined {
  return templates.find((template) => template.key === key);
}