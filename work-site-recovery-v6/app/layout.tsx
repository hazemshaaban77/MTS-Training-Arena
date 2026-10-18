import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTS Training Arena | Learn. Play. Rise.",
  description: "One session. Every challenge. Live bilingual learning.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
