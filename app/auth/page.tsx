import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "로그인" };

export default function AuthPage() {
  return (
    <PageShell width="narrow">
      <div className="mx-auto max-w-sm pt-6">
        <AuthForm />
        <p className="mt-3 text-center text-[11px] text-muted2">
          실서비스: Supabase Auth + 미들웨어로 /dashboard·/account 보호, 결제 결과·PDF 게이팅 (스펙 §11)
        </p>
      </div>
    </PageShell>
  );
}
