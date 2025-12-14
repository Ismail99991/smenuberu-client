// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Smenuberu",
  description: "Поиск исполнителей с быстрой оплатой",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
