import { http } from "../../../lib/http";

export type BibleToolConfig = {
  endpointPath?: string;
  languageCodeHL?: string;
};

export async function fetchBiblePassage(
  reference: string,
  config: BibleToolConfig
): Promise<string> {
  const endpointPath = config.endpointPath ?? "/v2/bible/passage";
  const languageCodeHL = config.languageCodeHL ?? "eng00";

  const payload = {
    entry: reference,
    languageCodeHL,
  };

  const res = await http.post(endpointPath, payload);
  const data: unknown = res && res.data ? res.data : res;

  return extractPassageFromJson(data).trim();
}

export function extractPassageFromJson(json: unknown): string {
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

    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return "";
    }
  }

  return "";
}