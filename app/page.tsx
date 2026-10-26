import Link from "next/link";
import { ArrowRight, BookOpenCheck, BrainCircuit, Compass, Search, ShieldCheck, Sparkles } from "lucide-react";
import { getServerUserFromAccess, roleHome } from "@/core/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: BookOpenCheck,
    number: "01",
    title: "Structured Project Briefs",
    text: "Explore ideas through clear objectives, scope boundaries, proposed solutions, and technology choices."
  },
  {
    icon: Search,
    number: "02",
    title: "Discover What Exists",
    text: "Search the catalogue and learn from projects already documented by your academic community."
  },
  {
    icon: BrainCircuit,
    number: "03",
    title: "Thoughtful Feature Ideas",
    text: "Request practical new feature ideas grounded in a project's context, technologies, and existing suggestions."
  },
];

export default async function HomePage() {
  const getResult = (await getServerUserFromAccess());
  const user = !("error" in getResult) ? getResult : undefined;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background px-4 md:px-6 lg:px-8 xl:px-12">
      {/* Background Radial Glow & Ambient Mesh Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-3xl opacity-50"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />

      {/* Hero Section */}
      <section className="relative border-b border-border/40 py-20 lg:py-28">
        <div className="page-shell grid gap-8 lg:grid-cols-[.03fr_1.17fr_.8fr] lg:items-center">
          <div></div>
          <div className=" backdrop-blur-sm mx-auto p-8 w-fit">
            <Badge
              variant="outline"
              className="mb-6 inline-flex items-center gap-2 rounded-full border-primary/30 bg-primary/10 px-4 py-3 text-[15px] font-semibold text-primary backdrop-blur-md"
            >
              <span>
                <Compass size={16} className="animate-spin-slow" />
              </span>
              The Academic Project Compass

            </Badge>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl/tight">
              Good projects begin with{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-emerald-400 bg-clip-text text-transparent">
                clear direction.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A curated space to explore graduation and semester project ideas, understand scope boundaries, and uncover thoughtful ways to take them further.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02]">
                <Link className="flex items-center gap-1" href={user ? roleHome(user.role) : "/projects"}>
                  Explore project ideas <ArrowRight size={16} className="ml-1" />
                </Link>
              </Button>

              {!user && (
                <Button variant="outline" size="lg" className="rounded-xl border-border/80 bg-background/50 px-6 backdrop-blur-md hover:bg-muted/50">
                  <Link className="flex items-center gap-1" href="/login">Staff & student sign in</Link>
                </Button>
              )}
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground/80">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" /> Curated academic briefs
              </span>
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" /> Context-aware AI inspiration
              </span>
            </div>
          </div>

          {/* Interactive Feature Preview Card (SpeedyJob Container Style) */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Ambient Backlight */}
            <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-primary/30 to-accent/30 opacity-70 blur-2xl" />

            <Card className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <CardHeader className="p-0 mb-6 flex-row items-start justify-between space-y-0">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">Project Brief Preview</p>
                  <CardTitle className="mt-1 text-2xl font-extrabold tracking-tight">Campus Connect</CardTitle>
                </div>
                <Badge className="rounded-lg bg-primary/20 text-primary border border-primary/30 font-semibold px-3 py-1">
                  Graduation
                </Badge>
              </CardHeader>

              <CardContent className="p-0 space-y-5">
                <CardDescription className="text-sm leading-relaxed text-muted-foreground/90 sm:text-[15px]">
                  A unified platform that helps students discover campus resources, activities, and academic support from one place.
                </CardDescription>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 backdrop-blur-sm space-y-2.5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">In Scope</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-md bg-background/60 border border-border/50 text-[11px]">Resource search</Badge>
                    <Badge variant="secondary" className="rounded-md bg-background/60 border border-border/50 text-[11px]">Event calendar</Badge>
                    <Badge variant="secondary" className="rounded-md bg-background/60 border border-border/50 text-[11px]">Student dashboard</Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-bold text-accent">
                    <Sparkles size={15} /> Feature inspiration
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/90">
                    Suggest meaningful enhancements based on project scope, technologies, and ideas already shared.
                  </p>
                </div>
              </CardContent>

              <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-[11px] font-medium text-muted-foreground">
                <span className="tracking-wide">Structured · Searchable · Shared</span>
                <span className="font-mono font-semibold text-primary">Preview</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="page-shell py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[15px] font-bold uppercase tracking-widest text-primary mb-2">A clearer starting point</p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Explore ideas with context, not guesswork.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            QC keeps the focus on project knowledge and practical inspiration — keeping academic planning simple and actionable.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pillars.map(({ icon: Icon, number, title, text }) => (
            <Card
              key={number}
              className="group relative rounded-[2rem] border border-white/10 bg-card/60 p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon size={22} />
                </span>
                <span className="font-mono text-sm font-bold text-muted-foreground/60 group-hover:text-primary">{number}</span>
              </div>
              <h3 className="mt-6 text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Action Banner */}
      <section className="page-shell pb-24">
        <Card className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-card via-card to-primary/10 p-8 sm:p-12 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-sm font-bold uppercase tracking-widest text-accent mb-2">Start Exploring</p>
              <h2 className="text-2xl font-extrabold sm:text-3xl tracking-tight">Find your next project direction.</h2>
              <p className="mt-2 max-w-xl text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
                Browse visible project briefs and use them as a launch point for your own academic thinking.
              </p>
            </div>
            <Button size="lg" className="rounded-xl px-6 font-semibold shadow-xl shadow-primary/20 shrink-0">
              <Link className="flex items-center gap-1" href={user ? roleHome(user.role) : "/projects"}>
                Open project catalogue <ArrowRight size={16} className="ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}