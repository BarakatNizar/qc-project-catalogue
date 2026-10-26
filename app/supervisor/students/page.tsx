// app/supervisor/students/page.tsx (or your respective path)
"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { UserPlus, Trash2, Search, Loader2 } from "lucide-react";
import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { FormField, TextInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UserDto } from "@/modules/user/mappers/user-mapper";
import { PaginationMeta } from "@/shared/utils/pagincation-utils";
import { listStudentsAction, searchStudentsAction } from "@/Interfaces/getters/user.getters";
import { CreateStudentPayload } from "@/shared/validation/user";
import { createStudentAction, deleteStudentAction } from "@/Interfaces/actions/users.actions";

export default function StudentsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [students, setStudents] = useState<UserDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Load initial students on mount
  useEffect(() => {
    async function loadInitialData() {
      setInitialLoading(true);
      const res = await listStudentsAction(1, 10);
      if ("error" in res) {
        setInitialError(res.error);
      } else {
        setStudents(res.data);
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
        ? await searchStudentsAction(query, 1, 10)
        : await listStudentsAction(1, 10);

      if ("error" in res) {
        notify.error("Search failed", res.error);
      } else {
        setStudents(res.data);
        setPagination(res.pagination);
      }
    });
  };

  // Handle Page Change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    startTransition(async () => {
      const res = searchQuery.trim()
        ? await searchStudentsAction(searchQuery, page, 10)
        : await listStudentsAction(page, 10);

      if ("error" in res) {
        notify.error("Pagination failed", res.error);
      } else {
        setStudents(res.data);
        setPagination(res.pagination);
      }
    });
  };

  // Handle Create Student
  const handleCreateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email");
    const payload: CreateStudentPayload = {
      collegeId: String(formData.get("collegeId") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: emailValue ? String(emailValue) : undefined,
    };

    const res = await createStudentAction(payload);
    if ("error" in res) {
      notify.error("Failed to create student", res.error);
    } else {
      notify.success(
        "Student account created",
        "Share the college ID as the login ID and initial password using a secure channel."
      );

      // Refresh list
      const updated = await (searchQuery.trim()
        ? searchStudentsAction(searchQuery, currentPage, 10)
        : listStudentsAction(currentPage, 10));

      if (!("error" in updated)) {
        setStudents(updated.data);
        setPagination(updated.pagination);
      }
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async (studentId: string) => {
    const res = await deleteStudentAction(studentId);
    if ("error" in res) {
      notify.error("Failed to delete student", res.error);
    } else {
      notify.success(
        "Student account deleted",
        "Historical AI provenance is preserved with the triggering-user reference cleared."
      );

      // Refresh list
      const updated = await (searchQuery.trim()
        ? searchStudentsAction(searchQuery, currentPage, 10)
        : listStudentsAction(currentPage, 10));

      if (!("error" in updated)) {
        setStudents(updated.data);
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
        eyebrow="Student accounts"
        title="Students"
        description="Create student accounts using each student's college ID. The college ID becomes the login ID and initial password; the student must change it at first sign-in."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        {/* Student Directory Section */}
        <section className="rounded-[2rem] border border-white/10 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
          <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold tracking-tight">Student directory</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {pagination?.totalCount ?? students.length} account{(pagination?.totalCount ?? students.length) === 1 ? "" : "s"}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name, ID..."
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

          {students.length ? (
            <div className="divide-y divide-border/60">
              {students.map((student) => (
                <div key={student.id} className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <Link
                      href={`/supervisor/students/${student.id}`}
                      className="font-bold tracking-tight text-foreground transition-colors hover:text-primary no-underline"
                    >
                      {student.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      College ID: <span className="font-mono font-semibold text-foreground">{student.collegeId}</span>
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/70">
                      {student.email ?? "No email provided"} · {student.mustChangePassword ? "Password change required" : "Active password"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Permanently delete this student account? Shared AI suggestions will remain.")) {
                        handleDeleteStudent(student.id);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={15} /> Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No student accounts found"
                description="Try adjusting your search criteria or create a new student account to allow access to visible project briefs and AI feature suggestions."
              />
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

        {/* Create Student Form Card */}
        <section className="rounded-[2.5rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl h-fit space-y-6">
          <div className="space-y-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <UserPlus size={22} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Create student</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                A student's college ID is unique and cannot be edited by the student later.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateStudent} className="space-y-4">
            <FormField label="Student full name*" name="name">
              <TextInput name="name" minLength={2} maxLength={160} placeholder="Student name" />
            </FormField>
            <FormField label="College ID*" name="collegeId" hint="Used as login ID and temporary password. at least 9 numbers">
              <TextInput name="collegeId" required minLength={2} maxLength={80} autoComplete="off" placeholder="e.g. 20231045" />
            </FormField>
            <FormField label="Email (optional)" name="email">
              <TextInput name="email" type="email" placeholder="student@university.edu" />
            </FormField>

            <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-sm">
              The temporary password is hashed before it is stored. The student must set a new password at first login.
            </div>

            <Button type="submit" className="w-full rounded-xl font-semibold shadow-lg shadow-primary/20">
              Create student account
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}