import Link from "next/link";
import { ArrowRight, FolderKanban, Users, UserCog, Bot } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCountsAction } from "@/Interfaces/getters/user.getters";
import ErrorState from "@/components/ErrorState";

export default async function AdminDashboard() {
  const adminData = await getCountsAction()
  if("error" in adminData){
    return <ErrorState message={adminData.error} />
  }
  const { data:counts } = adminData;
  
  const cards = [
    {
      label: "Supervisors",
      value: counts.supervisors,
      detail: "Provision and manage staff access",
      icon: UserCog,
    },
    {
      label: "Students",
      value: counts.students,
      detail: "Student accounts managed by Supervisors",
      icon: Users,
    },
    {
      label: "Projects",
      value: counts.projects,
      detail: "Structured briefs in the catalogue",
      icon: FolderKanban,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeading
        eyebrow="System overview"
        title="Welcome to administration"
        description="Manage Supervisor access and control whether new AI suggestions can be generated."
      />

      {/* Quick Metrics Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <Card
            key={label}
            className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
          >
            <CardHeader className="p-0 flex-row items-center justify-between space-y-0">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon size={22} />
              </span>
              <span className="font-mono text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Metric
              </span>
            </CardHeader>

            <CardContent className="p-0 mt-6">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <CardTitle className="mt-1 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {value}
              </CardTitle>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Control Banner */}
      <Card className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-card via-card to-primary/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="hidden sm:grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Bot size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
                AI Controls
              </p>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                AI service availability
              </h2>
              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Provider URLs, API keys, models, and the fixed prompt stay in deployment configuration.
              </p>
            </div>
          </div>

          <Button  size="lg" className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20 shrink-0">
            <Link href="/admin/ai" className="inline-flex items-center gap-2">
              <span>Manage AI availability</span>
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}