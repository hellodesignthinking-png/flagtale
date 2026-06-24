import { redirect } from "next/navigation";

// 발견·경험은 이제 홈(/)이 담당 → 기존 링크 호환용 리다이렉트.
export default function DiscoverRedirect() {
  redirect("/");
}
