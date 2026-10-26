import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import "@/app/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "Qalamoon Compass", template: "%s · Qalamoon Compass" },
  description: "A curated academic project catalogue with AI-assisted feature inspiration.",
  applicationName: "Qalamoon Compass",
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("qc_locale")?.value === "ar" ? "ar" : "en";
  const theme = cookieStore.get("qc_theme")?.value === "qc-dark" ? "qc-dark" : "qc-light";

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme={theme}
      suppressHydrationWarning
      className={cn("font-sans antialiased", geistSans.variable, geistMono.variable)}
    >
      <body className="relative flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        {/* Global Floating Header */}
        <SiteHeader locale={locale} />

        {/* Main Application Area */}
        <main id="main-content" className="flex-1 px-4 md:px-6 lg:px-8 xl:px-12">
          {children}
          <Toaster position="bottom-right" />
        </main>

        {/* SpeedyJob Glassmorphic Footer */}
        <footer className="relative mt-auto border-t border-white/10 bg-card/60 py-10 backdrop-blur-xl px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="page-shell flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <span className="font-medium text-xs text-muted-foreground/90">
                Qalamoon Compass <span className="mx-1 text-border">·</span> Academic Project Discovery
              </span>
            </div>

            <p className="font-mono text-[11px] font-semibold text-muted-foreground/70 tracking-wide">
              Explore ideas. Understand scope. Build with purpose.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}