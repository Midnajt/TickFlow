import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TickFlow",
  description: "Created with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

