import EditorJS, { type OutputData } from "@editorjs/editorjs";

import { createEditorTools } from "./createEditorTools";

type CreateEditorOptions = {
  data?: OutputData;
  holder: string;
};

export function createEditor(
  options: CreateEditorOptions
): EditorJS {
  return new EditorJS({
    autofocus: true,
    data: options.data,
    holder: options.holder,
    tools: createEditorTools(),
  });
}