import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PointPal | The Point Café Concierge",
  description:
    "A grounded menu and FAQ concierge for The Point Café, created for The Point × QD Fellowship.",
  metadataBase: new URL("https://pointpal-thepoint.vercel.app"),
  openGraph: {
    title: "PointPal — The Point’s smart café concierge",
    description: "Find a coffee, check a price, or plan your visit with grounded public information.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#70825F",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
