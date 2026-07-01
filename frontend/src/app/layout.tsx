import type { Metadata } from "next";
import { Roboto, Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const montserratHeading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Muret Airsoft",
  description: "Airsoft Game Events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        roboto.variable,
        montserratHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
