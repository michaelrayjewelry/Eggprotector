import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "X Content Agent",
  description: "Plan and manage your X account with an intelligent content agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-950 text-gray-100 font-sans">
        {children}
      </body>
    </html>
  );
}
