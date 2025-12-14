import "./globals.css";
import { ViewTransitions } from "next-view-transitions";

export const metadata = {
  title: "Smenuberu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <ViewTransitions>
    <html lang="ru">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
    </ViewTransitions>
  );
}
