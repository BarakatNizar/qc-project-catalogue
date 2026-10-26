// import Link from "next/link";
// import { UserPlus, Users } from "lucide-react";
// import { requireRole } from "@/core/auth/session";
// import { userService } from "@/modules/user/services/user-service";
// import { createSupervisorAction, deleteSupervisorAction } from "@/Interfaces/actions/users.actions";
// import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
// import { PageHeading } from "@/components/ui/page-heading";
// import { Alert } from "@/components/ui/alert";
// import { FormField, TextInput } from "@/components/ui/form-field";
// import { EmptyState } from "@/components/ui/empty-state";
// import { Button } from "@/components/ui/button";

// export default async function SupervisorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
//   const actor = await requireRole("ADMIN");
//   const [supervisors, params] = await Promise.all([userService.listSupervisors(actor), searchParams]);
//   const error = typeof params.error === "string" ? params.error : null;

//   return (
//     <div className="space-y-6">
//       <PageHeading
//         eyebrow="Access management"
//         title="Supervisors"
//         description="Create and maintain QC Supervisor accounts. Every Supervisor can manage all students and all project briefs."
//       />

//       {error && <Alert type="error">{error}</Alert>}
//       {params.created && <Alert type="success">Supervisor account created.</Alert>}
//       {params.deleted && <Alert type="success">Supervisor account removed. Students remain and their supervisor association is cleared.</Alert>}

//       <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
//         {/* Supervisor Directory Section */}
//         <section className="rounded-[2rem] border border-white/10 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
//           <div className="flex items-center justify-between border-b border-white/10 p-6">
//             <div className="space-y-0.5">
//               <h2 className="text-lg font-bold tracking-tight">Supervisor directory</h2>
//               <p className="font-mono text-xs text-muted-foreground">
//                 {supervisors.length} account{supervisors.length === 1 ? "" : "s"}
//               </p>
//             </div>
//             <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
//               <Users size={20} />
//             </span>
//           </div>

//           {supervisors.length ? (
//             <div className="divide-y divide-border/60">
//               {supervisors.map((supervisor) => (
//                 <div key={supervisor.id} className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
//                   <div className="flex items-center gap-3.5">
//                     <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary border border-primary/20">
//                       {supervisor.name.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
//                     </span>
//                     <div className="space-y-0.5">
//                       <p className="font-bold tracking-tight text-foreground">{supervisor.name}</p>
//                       <p className="text-xs text-muted-foreground">{supervisor.loginId}{supervisor.email ? ` · ${supervisor.email}` : ""}</p>
//                       <p className="font-mono text-[10px] text-muted-foreground/60">Created {supervisor.createdAt.toLocaleDateString()}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Button  variant="outline" size="sm" className="rounded-xl border-border/80">
//                       <Link href={`/admin/supervisors/${supervisor.id}`}>Edit</Link>
//                     </Button>
//                     <form action={deleteSupervisorAction}>
//                       <input type="hidden" name="supervisorId" value={supervisor.id} />
//                       <ConfirmSubmitButton
//                         className="rounded-xl px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
//                         confirmMessage="Permanently delete this Supervisor account? Associated students will remain."
//                       >
//                         Delete
//                       </ConfirmSubmitButton>
//                     </form>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="p-6">
//               <EmptyState title="No Supervisors yet" description="Create the first Supervisor account to start managing student accounts and the project catalogue." />
//             </div>
//           )}
//         </section>

//         {/* Create Supervisor Form Card */}
//         <section className="rounded-[2.5rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl h-fit space-y-6">
//           <div className="space-y-3">
//             <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
//               <UserPlus size={22} />
//             </span>
//             <div>
//               <h2 className="text-xl font-extrabold tracking-tight">Create Supervisor</h2>
//               <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
//                 Set a login ID and a temporary password. Share credentials securely with the Supervisor.
//               </p>
//             </div>
//           </div>

//           <form action={createSupervisorAction} className="space-y-4">
//             <FormField label="Full name" name="name">
//               <TextInput name="name" required minLength={2} maxLength={160} placeholder="Supervisor name" />
//             </FormField>
//             <FormField label="Login ID" name="loginId">
//               <TextInput name="loginId" required minLength={3} maxLength={120} autoComplete="off" placeholder="e.g. dr.hassan" />
//             </FormField>
//             <FormField label="Email (optional)" name="email">
//               <TextInput name="email" type="email" placeholder="name@university.edu" />
//             </FormField>
//             <FormField label="Temporary password" name="password" hint="At least 12 characters. QC does not generate or email passwords automatically.">
//               <TextInput name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" placeholder="••••••••••••" />
//             </FormField>
//             <Button type="submit" className="w-full rounded-xl font-semibold shadow-lg shadow-primary/20">
//               Create account
//             </Button>
//           </form>
//         </section>
//       </div>
//     </div>
//   );
// }
// app/admin/supervisors/page.tsx (or your respective path)
"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { UserPlus, Users, Search, Loader2 } from "lucide-react";
import { listSupervisorsAction, searchSupervisorsAction } from "@/Interfaces/getters/user.getters";
import { createSupervisorAction, deleteSupervisorAction } from "@/Interfaces/actions/users.actions";
import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { FormField, TextInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { UserDto } from "@/modules/user/mappers/user-mapper";
import { PaginationMeta } from "@/shared/utils/pagincation-utils";
import { CreateSupervisorPayload } from "@/shared/validation/user";


export default function SupervisorsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<UserDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Load initial supervisors
  useEffect(() => {
    async function loadInitialData() {
      setInitialLoading(true);
      const res = await listSupervisorsAction(1, 10);
      if ("error" in res) {
        setInitialError(res.error);
      } else {
        setSupervisors(res.data);
        setPagination(res.pagination);
      }
      setInitialLoading(false);
    }
    loadInitialData();
  }, []);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);

    startTransition(async () => {
      const res = query.trim()
        ? await searchSupervisorsAction(query, 1, 10)
        : await listSupervisorsAction(1, 10);

      if ("error" in res) {
        notify.error("Search failed", res.error);
      } else {
        setSupervisors(res.data);
        setPagination(res.pagination);
      }
    });
  };

  // Handle Page Change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    startTransition(async () => {
      const res = searchQuery.trim()
        ? await searchSupervisorsAction(searchQuery, page, 10)
        : await listSupervisorsAction(page, 10);

      if ("error" in res) {
        notify.error("Pagination failed", res.error);
      } else {
        setSupervisors(res.data);
        setPagination(res.pagination);
      }
    });
  };

  // Handle Create Supervisor
  const handleCreateSupervisor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: CreateSupervisorPayload = {
      loginId: String(formData.get("loginId") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const res = await createSupervisorAction(payload);
    if ("error" in res) {
      notify.error("Failed to create supervisor", res.error);
    } else {
      notify.success("Supervisor account created", "Credentials have been successfully initialized.");
      const updated = await (searchQuery.trim()
        ? searchSupervisorsAction(searchQuery, currentPage, 10)
        : listSupervisorsAction(currentPage, 10));

      if (!("error" in updated)) {
        setSupervisors(updated.data);
        setPagination(updated.pagination);
      }
    }
  };

  // Handle Delete Supervisor
  const handleDeleteSupervisor = async (supervisorId: string) => {
    const res = await deleteSupervisorAction(supervisorId);
    if ("error" in res) {
      notify.error("Failed to delete supervisor", res.error);
    } else {
      notify.success("Supervisor account removed", "Students remain and their supervisor association is cleared.");
      // Refresh list
      const updated = await (searchQuery.trim()
        ? searchSupervisorsAction(searchQuery, currentPage, 10)
        : listSupervisorsAction(currentPage, 10));

      if (!("error" in updated)) {
        setSupervisors(updated.data);
        setPagination(updated.pagination);
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (initialError) {
    return <ErrorState message={initialError} />;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Access management"
        title="Supervisors"
        description="Create and maintain QC Supervisor accounts. Every Supervisor can manage all students and all project briefs."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Supervisor Directory Section */}
        <section className="rounded-[2rem] border border-white/10 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
          <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold tracking-tight">Supervisor directory</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {pagination?.totalCount ?? supervisors.length} account{(pagination?.totalCount ?? supervisors.length) === 1 ? "" : "s"}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or ID..."
                className="w-full rounded-xl border border-border/80 bg-background/50 pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {isPending && (
            <div className="flex items-center justify-center p-4 bg-primary/5">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="ml-2 text-xs text-muted-foreground">Updating directory...</span>
            </div>
          )}

          {supervisors.length ? (
            <div className="divide-y divide-border/60">
              {supervisors.map((supervisor) => (
                <div key={supervisor.id} className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary border border-primary/20">
                      {supervisor.name.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold tracking-tight text-foreground">{supervisor.name}</p>
                      <p className="text-xs text-muted-foreground">{supervisor.loginId}{supervisor.email ? ` · ${supervisor.email}` : ""}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/60">Created {new Date(supervisor.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl border-border/80" >
                      <Link href={`/admin/supervisors/${supervisor.id}`}>Edit</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Permanently delete this Supervisor account? Associated students will remain.")) {
                          handleDeleteSupervisor(supervisor.id);
                        }
                      }}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState title="No Supervisors found" description="Try adjusting your search criteria or create a new Supervisor account." />
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 p-4 bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="rounded-xl"
              >
                Previous
              </Button>
              <span className="font-mono text-xs text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          )}
        </section>

        {/* Create Supervisor Form Card */}
        <section className="rounded-[2.5rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl h-fit space-y-6">
          <div className="space-y-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <UserPlus size={22} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Create Supervisor</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Set a login ID and a temporary password. Share credentials securely with the Supervisor.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSupervisor} className="space-y-4">
            <FormField label="Full name" name="name">
              <TextInput name="name" required minLength={2} maxLength={160} placeholder="Supervisor name" />
            </FormField>
            <FormField label="Login ID" name="loginId">
              <TextInput name="loginId" required minLength={3} maxLength={120} autoComplete="off" placeholder="e.g. 202110878" />
            </FormField>
            <FormField label="Email (optional)" name="email">
              <TextInput name="email" type="email" placeholder="name@university.edu" />
            </FormField>
            <FormField label="Temporary password" name="password" hint="At least 9 characters. QC does not generate or email passwords automatically.">
              <TextInput name="password" type="password" required minLength={9} maxLength={128} autoComplete="new-password" placeholder="••••••••••••" />
            </FormField>
            <Button type="submit" className="w-full rounded-xl font-semibold shadow-lg shadow-primary/20">
              Create account
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}