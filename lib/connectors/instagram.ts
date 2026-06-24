import fs from "node:fs";
import path from "node:path";

// 핫지역 인스타그램 해시태그 버즈 — Apify(apify/instagram-scraper)로 수집해 data/instagram.json에 저장한 값을 읽음.
// 갱신: scripts/ingest-instagram.mjs (APIFY_TOKEN 필요). 서버 전용(fs).
export interface IgTag {
  tag: string;
  postsCount: number;
  url: string;
}

let _cache: Record<string, IgTag> | null = null;

function load(): Record<string, IgTag> {
  if (_cache) return _cache;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "instagram.json"), "utf-8")) as {
      byName?: Record<string, { tag: string; postsCount: number }>;
    };
    const by = raw.byName ?? {};
    const out: Record<string, IgTag> = {};
    for (const k in by) {
      out[k] = { tag: by[k].tag, postsCount: by[k].postsCount, url: `https://www.instagram.com/explore/tags/${encodeURIComponent(by[k].tag)}/` };
    }
    return (_cache = out);
  } catch {
    return (_cache = {});
  }
}

/** 핫지역 내러티브명 → 인스타 해시태그 버즈(게시물 수·태그 링크). 없거나 0이면 null. */
export function instagramFor(name?: string | null): IgTag | null {
  if (!name) return null;
  const v = load()[name];
  return v && v.postsCount > 0 ? v : null;
}

/** 게시물 수 축약 — 2,260,000 → "226만". */
export function igCountLabel(n: number): string {
  return n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만` : n.toLocaleString();
}
