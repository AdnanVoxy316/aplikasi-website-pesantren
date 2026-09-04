import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ELMS Pesantren",
    template: "%s | ELMS Pesantren",
  },
  description:
    "Learning Management System pesantren: akademik, tugas, kehadiran, rapor, dan pembayaran SPP dalam satu ruang.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
