import { redirect } from "next/navigation";

// 발견·경험은 홈(/)이 담당 — 기존 링크 보존용 직접 리다이렉트(이중 리다이렉트 방지).
export default function ExperiencePage() {
  redirect("/");
}
