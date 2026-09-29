import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlobalWork EOR Console",
  description: "A fictional Employer of Record SaaS platform for engineering practice."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
