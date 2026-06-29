import { redirect } from "next/navigation";

// 플래그맵을 메인으로 — 접속 시 디지털 플래그맵으로 진입(인트로 스플래시는 /map-tale에서).
// 기존 발견·경험 랜딩은 /discover로 이동.
export default function Home() {
  redirect("/map-tale");
}
