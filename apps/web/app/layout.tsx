import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "../lib/trpc-provider";

export const metadata: Metadata = {
  title: "FamilyPlate - AI Family Meal Planning Made Simple",
  description: "Generate personalized 7-day meal plans for your family. Vote on meals, get shopping lists, and enjoy stress-free dinner planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
