import { NextRequest, NextResponse } from "next/server";
import { loadDistricts, loadScores } from "@/lib/data";
import { colorForLayer, displayForLayer, gradeOf, pickScore } from "@/lib/scoring";
import type { LayerId } from "@/lib/types";

// 스펙 §13: GET /api/places?period=&layer= → GeoJSON FeatureCollection(value, grade, color)
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const layer = (sp.get("layer") || "klai") as LayerId;
  const scores = loadScores();
  const period = sp.get("period") || scores.last;
  const base = loadDistricts();

  const features = base.features.map((f) => {
    const series = scores.byPlace[f.properties.admCd2] ?? [];
    const score = pickScore(series, period);
    const numeric =
      layer === "klai" || layer === "d1" || layer === "d2" || layer === "d3" || layer === "d4"
        ? (score as unknown as Record<string, number>)[layer]
        : layer === "momentum"
        ? score.momentum
        : layer === "gentri"
        ? score.gentriG
        : layer === "popchange"
        ? score.popChangeRate
        : layer === "budget"
        ? score.budgetInflow
        : score.klai;
    return {
      ...f,
      properties: {
        ...f.properties,
        value: numeric,
        grade: gradeOf(score.klai),
        label: displayForLayer(layer, score),
        color: colorForLayer(layer, score),
      },
    };
  });

  return NextResponse.json({ type: "FeatureCollection", layer, period, features });
}
