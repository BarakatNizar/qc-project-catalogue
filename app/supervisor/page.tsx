import Link from "next/link";
import { ArrowRight, FolderKanban, Users, Eye, Plus } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/ErrorState";
import { getCountsAction } from "@/Interfaces/getters/user.getters";

export default async function SupervisorDashboard() {
  const supervisorData = await getCountsAction()
  if("error" in supervisorData){
    return <ErrorState message={supervisorData.error} />
  }
  const { data:counts , user} = supervisorData;
  

  const stats = [
    {
      title: "Project briefs",
      value: counts.projects,
      icon: FolderKanban,
      href: "/supervisor/projects",
      detail: "Create, maintain, and publish briefs",
    },
    {
      title: "Student accounts",
      value: counts.students,
      icon: Users,
      href: "/supervisor/students",
      detail: "Provision and manage student access",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Your workspace"
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Keep project briefs useful, scoped, and discoverable for students across the college."
        action={
          <Button size="lg" className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20">
            <Link href="/supervisor/projects/new" className="inline-flex items-center gap-2">
              <Plus size={18} />
              <span>Create project</span>
              <ArrowRight size={16} />
            </Link>
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {stats.map(({ title, value, icon: Icon, href, detail }) => (
          <Link key={title} href={href} className="group no-underline">
            <Card className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon size={22} />
                </span>
                <div className="space-y-1">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                  </p>
                  <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {value}
                  </CardTitle>
                  <p className="text-xs leading-relaxed text-muted-foreground/80">
                    {detail}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overview Banner */}
      <Card className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-card via-card to-primary/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="space-y-2">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
            Catalogue Overview
          </p>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Shared academic catalogue
          </h2>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/90 sm:text-sm">
            Every Supervisor can edit every project and manage every student. Project Supervisor names are metadata fields and do not control QC account permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="outline" className="rounded-xl font-semibold border-border/80">
            <Link href="/supervisor/projects" className="inline-flex items-center gap-2">
              <Eye size={16} className="text-primary" />
              <span>Review catalogue</span>
            </Link>
          </Button>
          <Button variant="ghost" className="rounded-xl font-semibold">
            <Link href="/supervisor/students" className="inline-flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <span>Manage students</span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}