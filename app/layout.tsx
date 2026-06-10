import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academic Result Portal | Student & Teacher Hub",
  description: "Secure, real-time Student Result Lookup and Teacher Administrative Console.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f8fafc] text-slate-800 antialiased min-h-screen relative w-full" suppressHydrationWarning>
        {/* Soft elegant static grain and clean grid background */}
        <div className="noise-overlay" />
        <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
        
        <div className="relative z-10 w-full min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
