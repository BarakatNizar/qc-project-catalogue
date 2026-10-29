import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "@/app/globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  icons:'/icon.svg',
  title: {
    default: "Qalamoon Compass",
    template: "%s · Qalamoon Compass",
  },
  description:
    "A curated academic project catalogue with AI-assisted feature inspiration.",
  applicationName: "Qalamoon Compass",
};

export const viewport: Viewport = {
  themeColor: "#F59E0B",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();

  const locale = cookieStore.get("qc_locale")?.value === "ar" ? "ar" : "en";

  const theme =
    cookieStore.get("qc_theme")?.value === "qc-dark"
      ? "qc-dark"
      : "qc-light";

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme={theme}
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        geistSans.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        <SiteHeader locale={locale} />

        <main
          id="main-content"
          className="w-full flex-1 px-4 md:px-6 lg:px-8 xl:px-12"
        >
          {children}
        </main>

        <Toaster position="bottom-right" />

        <footer className="mt-auto border-t border-border/80 bg-card/60 px-4 py-7 backdrop-blur-xl md:px-6 md:py-8 lg:px-8 xl:px-12">
          <div className="page-shell flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-start">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/10"
              />

              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Qalamoon Compass
                </span>
                <span className="mx-2 text-border" aria-hidden="true">
                  ·
                </span>
                <span>Academic Project Discovery</span>
              </p>
            </div>

            <p className="max-w-full text-xs leading-relaxed text-muted-foreground sm:text-end">
              Explore ideas. Understand scope. Build with purpose.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}