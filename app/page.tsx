import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Compass,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getServerUserFromAccess, roleHome } from "@/core/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pillars = [
  {
    icon: BookOpenCheck,
    number: "01",
    title: "Structured Project Briefs",
    text: "Explore ideas through clear objectives, scope boundaries, proposed solutions, and technology choices.",
    accent: "text-primary",
    iconBackground: "bg-primary/10",
  },
  {
    icon: Search,
    number: "02",
    title: "Discover What Exists",
    text: "Search the catalogue and learn from projects already documented by your academic community.",
    accent: "text-accent",
    iconBackground: "bg-accent/10",
  },
  {
    icon: BrainCircuit,
    number: "03",
    title: "Thoughtful Feature Ideas",
    text: "Request practical new feature ideas grounded in a project's context, technologies, and existing suggestions.",
    accent: "text-emerald-500",
    iconBackground: "bg-emerald-500/10",
  },
];

export default async function HomePage() {
  const getResult = await getServerUserFromAccess();
  const user = !("error" in getResult) ? getResult : undefined;

  const catalogueHref = user ? roleHome(user.role) : "/projects";

  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-background">
      {/* Restrained ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden"
      >
        <div className="absolute -top-56 left-1/2 h-[560px] w-[min(1000px,120vw)] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.12] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      </div>

      {/* Hero */}
      <section className="relative border-b border-border/60">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-8 lg:py-24 xl:gap-20">
          {/* Hero content */}
          <div className="min-w-0">
            <Badge
              variant="outline"
              className="mb-7 inline-flex max-w-full items-center gap-2 rounded-full border-primary/30 bg-primary/5 px-4 py-3 text-[15px] font-semibold text-primary backdrop-blur-sm"
            >
              <Compass size={16} className="shrink-0" />
              <span>The Academic Project Compass</span>
            </Badge>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl/tight">
              Good projects begin with{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-emerald-400 bg-clip-text text-transparent">
                clear direction.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A curated space to explore graduation and semester project ideas,
              understand scope boundaries, and uncover thoughtful ways to take
              them further.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
              <Link
                href={catalogueHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Explore project ideas
                <ArrowRight size={16} />
              </Link>

              {!user && (
                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-background/70 px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Staff &amp; student sign in
                </Link>
              )}
            </div>

            <div className="mt-10 flex flex-col gap-3 text-sm font-medium text-muted-foreground/90 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:gap-x-7">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-primary" />
                Curated academic briefs
              </span>

              <span className="flex items-center gap-2">
                <Sparkles size={16} className="shrink-0 text-accent" />
                Context-aware AI inspiration
              </span>
            </div>
          </div>

          {/* Project preview */}
          <div className="relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-emerald-500/10 opacity-80 blur-2xl"
            />

            <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card/95 shadow-2xl shadow-black/5 backdrop-blur-xl sm:rounded-[2rem]">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <BookOpenCheck size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                      Project brief preview
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Inside the catalogue
                    </p>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className="flex shrink-0 items-center gap-1.5"
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Preview
                  </span>
                </span>
              </div>

              <CardHeader className="space-y-4 p-5 pb-4 sm:p-7 sm:pb-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle className="min-w-0 text-2xl font-extrabold tracking-tight">
                    Campus Connect
                  </CardTitle>

                  <Badge className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1 font-semibold text-primary hover:bg-primary/10">
                    Graduation
                  </Badge>
                </div>

                <CardDescription className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  A unified platform that helps students discover campus
                  resources, activities, and academic support from one place.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 px-5 pb-5 sm:space-y-6 sm:px-7 sm:pb-7">
                {/* Scope */}
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4 sm:rounded-2xl sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      In Scope
                    </p>
                    <span className="text-xs font-medium text-muted-foreground">
                      03 features
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="max-w-full rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium"
                    >
                      Resource search
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="max-w-full rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium"
                    >
                      Event calendar
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="max-w-full rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium"
                    >
                      Student dashboard
                    </Badge>
                  </div>
                </div>

                {/* AI inspiration */}
                <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-accent/[0.06] p-4 sm:rounded-2xl sm:p-5">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-accent/10 blur-2xl"
                  />

                  <div className="relative flex items-center gap-2">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Sparkles size={15} />
                    </div>

                    <p className="text-sm font-bold text-foreground">
                      Feature inspiration
                    </p>

                    <Badge
                      variant="outline"
                      className="ml-auto shrink-0 border-accent/25 bg-background/70 text-xs text-accent"
                    >
                      AI
                    </Badge>
                  </div>

                  <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
                    Suggest meaningful enhancements based on project scope,
                    technologies, and ideas already shared.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/70 pt-4 text-[11px] font-medium text-muted-foreground">
                  <span className="tracking-wide">
                    Structured · Searchable · Shared
                  </span>
                  <span className="font-mono font-semibold text-primary">
                    Academic discovery
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-end">
              <ShieldCheck size={14} className="shrink-0 text-primary" />
              <span>Explore projects with their context intact</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section className="relative">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-2 font-mono text-[15px] font-bold uppercase tracking-widest text-primary">
              A clearer starting point
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Explore ideas with context, not guesswork.
            </h2>

            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              QC keeps the focus on project knowledge and practical inspiration
              — keeping academic planning simple and actionable.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {pillars.map(
              ({
                icon: Icon,
                number,
                title,
                text,
                accent,
                iconBackground,
              }) => (
                <Card
                  key={number}
                  className="group relative min-w-0 overflow-hidden rounded-2xl border-border/70 bg-card/80 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5"
                >
                  <CardContent className="p-5 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-xl ${iconBackground} ${accent} transition-transform duration-200 group-hover:scale-105`}
                      >
                        <Icon size={22} />
                      </div>

                      <span className="font-mono text-sm font-bold text-muted-foreground/60 transition-colors group-hover:text-primary">
                        {number}
                      </span>
                    </div>

                    <h3 className="mt-6 text-lg font-bold tracking-tight">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                      {text}
                    </p>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <Card className="relative overflow-hidden rounded-2xl border-border/70 bg-card shadow-xl shadow-black/[0.03] sm:rounded-[2rem]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-full bg-gradient-to-l from-primary/[0.09] via-accent/[0.04] to-transparent sm:w-3/4"
          />

          <div className="relative flex flex-col gap-7 p-5 sm:gap-8 sm:p-8 md:flex-row md:items-center md:justify-between md:p-10 lg:p-12">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-2 font-mono text-sm font-bold uppercase tracking-widest text-accent">
                Start Exploring
              </p>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Find your next project direction.
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                Browse visible project briefs and use them as a launch point
                for your own academic thinking.
              </p>
            </div>

            <Link
              href={catalogueHref}
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-fit"
            >
              Open project catalogue
              <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}