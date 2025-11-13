import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified Console",
  description: "Your unified personal console for messages, files, and AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
