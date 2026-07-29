import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GigDesk - E-Signed Invoices for Freelancers",
  description: "Create, manage, and track e-signed invoices in real time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
