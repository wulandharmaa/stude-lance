import "./globals.css";
import type { Metadata } from "next";
import QueryProvider from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "StudeLance",
  description: "Freelance platform for university students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
