import type { MetadataRoute } from "next";
import { listPlaces, loadReports } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flatalelocal.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/map-tale", "/map", "/lab", "/hub", "/reports", "/diagnose", "/pricing", "/methodology", "/data", "/brand", "/design", "/contribute"].map((p) => ({
    url: `${SITE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  let reports: MetadataRoute.Sitemap = [];
  try { reports = loadReports().map((r) => ({ url: `${SITE}/reports/${r.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })); } catch { /* noop */ }
  let places: MetadataRoute.Sitemap = [];
  try { places = listPlaces().map((p) => ({ url: `${SITE}/place/${p.admCd2}`, changeFrequency: "monthly" as const, priority: 0.4 })); } catch { /* noop */ }
  return [...statics, ...reports, ...places];
}
