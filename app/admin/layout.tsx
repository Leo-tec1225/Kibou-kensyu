import type { Metadata } from "next";

// 管理画面は受講者画面とは別のPWAとしてインストールできるよう、別のmanifestを使う
export const metadata: Metadata = {
  title: "研修管理システム",
  manifest: "/admin.webmanifest",
  icons: { apple: "/admin-apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "研修管理" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
