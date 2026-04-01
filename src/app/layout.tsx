import type { Metadata } from "next";
import { MainNav } from "@/components/main-nav";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruzafa App",
  description: "Gestión financiera del emprendimiento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
            <MainNav />
            <main className="flex-1 py-5 sm:py-6">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
