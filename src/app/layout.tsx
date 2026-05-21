import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Blue Book Bergen — learn every street in Bergen",
  description:
    "A Bergen cab-driver's Knowledge — quiz games for memorising every street, square and route in Bergen Sentrum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
