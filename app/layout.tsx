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
    <html lang="pl" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-gray-900 text-gray-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

