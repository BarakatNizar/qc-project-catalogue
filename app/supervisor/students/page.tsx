
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { FormField, TextInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

import type { UserDto } from "@/modules/user/mappers/user-mapper";
import type { PaginationMeta } from "@/shared/utils/pagincation-utils";
import type { CreateStudentPayload } from "@/shared/validation/user";
import {
  createStudentAction,
  deleteStudentAction,
} from "@/Interfaces/actions/users.actions";
import {
  listStudentsAction,
  searchStudentsAction,
} from "@/Interfaces/getters/user.getters";

const PAGE_SIZE = 10;

export default function StudentsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [students, setStudents] = useState<UserDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(
    () => new Set(),
  );

  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

  // Debounce search input to avoid a server request on every keystroke.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load a page of students and ignore results from superseded requests.
  const loadStudents = useCallback(
    async (query: string, page: number) => {
      const requestId = ++requestIdRef.current;

      setIsRefreshing(true);

      try {
        const res = query
          ? await searchStudentsAction(query, page, PAGE_SIZE)
          : await listStudentsAction(page, PAGE_SIZE);

        if (requestId !== requestIdRef.current) return;

        if ("error" in res) {
          if (!hasLoadedRef.current) {
            setInitialError(res.error);
          } else {
            notify.error("Unable to load students", res.error);
          }

          return;
        }

        setStudents(res.data);
        setPagination(res.pagination);
        setInitialError(null);
        hasLoadedRef.current = true;
      } catch {
        if (requestId !== requestIdRef.current) return;

        if (!hasLoadedRef.current) {
          setInitialError(
            "Unable to load student accounts. Please try again.",
          );
        } else {
          notify.error(
            "Unable to load students",
            "An unexpected error occurred. Please try again.",
          );
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsRefreshing(false);
          setInitialLoading(false);
        }
      }
    },
    [],
  );

  // Refresh when the settled search query or current page changes.
  useEffect(() => {
    void loadStudents(debouncedQuery, currentPage);

    return () => {
      requestIdRef.current += 1;
    };
  }, [debouncedQuery, currentPage, loadStudents]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (isRefreshing || !pagination) return;
    if (page < 1 || page > pagination.totalPages) return;

    setCurrentPage(page);
  };

  const handleCreateStudent = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isCreating) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const emailValue = String(formData.get("email") ?? "").trim();

    const payload: CreateStudentPayload = {
      collegeId: String(formData.get("collegeId") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      email: emailValue || undefined,
    };

    setIsCreating(true);

    try {
      const res = await createStudentAction(payload);

      if ("error" in res) {
        notify.error("Failed to create student", res.error);
        return;
      }

      notify.success(
        "Student account created",
        "Share the college ID as the login ID and initial password using a secure channel.",
      );

      form.reset();

      // Refresh using the currently settled directory query.
      await loadStudents(debouncedQuery, currentPage);
    } catch {
      notify.error(
        "Failed to create student",
        "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (deletingIds.has(studentId)) return;

    setDeletingIds((previous) => {
      const next = new Set(previous);
      next.add(studentId);
      return next;
    });

    try {
      const res = await deleteStudentAction(studentId);

      if ("error" in res) {
        notify.error("Failed to delete student", res.error);
        return;
      }

      notify.success(
        "Student account deleted",
        "Historical AI provenance is preserved with the triggering-user reference cleared.",
      );

      // If deletion empties the current page, move back one page.
      const query = debouncedQuery;

      const updated = query
        ? await searchStudentsAction(query, currentPage, PAGE_SIZE)
        : await listStudentsAction(currentPage, PAGE_SIZE);

      if ("error" in updated) {
        notify.error(
          "Student deleted",
          "The account was deleted, but the directory could not be refreshed.",
        );
        return;
      }

      if (
        updated.data.length === 0 &&
        currentPage > 1
      ) {
        setCurrentPage((page) => Math.max(1, page - 1));
        return;
      }

      setStudents(updated.data);
      setPagination(updated.pagination);
    } catch {
      notify.error(
        "Failed to delete student",
        "An unexpected error occurred. Please try again.",
      );
    } finally {
      setDeletingIds((previous) => {
        const next = new Set(previous);
        next.delete(studentId);
        return next;
      });
    }
  };

  if (initialLoading) {
    return (
      <div
        className="mx-auto w-full max-w-7xl space-y-6"
        role="status"
        aria-label="Loading student accounts"
      >
        <div className="space-y-3">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-56 max-w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5 rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
            <div className="h-10 animate-pulse rounded-xl bg-muted" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-border/50 py-4"
              >
                <div className="size-11 animate-pulse rounded-2xl bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-40 max-w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-56 max-w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit space-y-5 rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-56 max-w-full animate-pulse rounded bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>

        <span className="sr-only">Loading student directory...</span>
      </div>
    );
  }

  if (initialError) {
    return <ErrorState message={initialError} />;
  }

  const totalCount = pagination?.totalCount ?? students.length;

  return (
    <div className="mx-auto w-full  space-y-6 pb-8 sm:space-y-8">
      <PageHeading
        eyebrow="Student accounts"
        title="Student directory"
        description="Create and manage student accounts, find existing students, and review their account details. Each student uses their college ID as their login ID and initial password, with a password change required at first sign-in."
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
        {/* Student directory */}
        <section
          aria-labelledby="student-directory-title"
          className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
        >
          <div className="space-y-4 border-b border-border/70 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                <Users size={20} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h2
                  id="student-directory-title"
                  className="text-lg font-bold tracking-tight"
                >
                  All students
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Search the directory, open a student profile, or remove an
                  account that is no longer needed.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="text-sm text-muted-foreground"
                aria-live="polite"
              >
                <span className="font-semibold tabular-nums text-foreground">
                  {totalCount}
                </span>{" "}
                student {totalCount === 1 ? "account" : "accounts"}
                {searchQuery.trim() && (
                  <span className="break-words">
                    {" "}
                    matching &ldquo;{searchQuery.trim()}&rdquo;
                  </span>
                )}
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name or college ID"
                  aria-label="Search students by name or college ID"
                  autoComplete="off"
                  className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear student search"
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {isRefreshing && (
            <div
              className="flex items-center gap-2 border-b border-primary/10 bg-primary/5 px-5 py-3 sm:px-6"
              role="status"
            >
              <Loader2
                size={15}
                className="animate-spin text-primary"
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-muted-foreground">
                Updating student directory...
              </span>
            </div>
          )}

          {students.length > 0 ? (
            <div
              className={`divide-y divide-border/60 transition-opacity ${
                isRefreshing ? "opacity-60" : "opacity-100"
              }`}
              aria-busy={isRefreshing}
            >
              {students.map((student) => {
                const isDeleting = deletingIds.has(student.id);

                return (
                  <article
                    key={student.id}
                    className="flex min-w-0 flex-col gap-4 p-5 transition-colors hover:bg-muted/20 sm:p-6 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border/70 bg-muted/50 text-muted-foreground">
                        <Users size={19} aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <Link
                          href={`/supervisor/students/${student.id}`}
                          className="block break-words text-sm font-bold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
                        >
                          {student.name}
                        </Link>

                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Fingerprint
                              size={14}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                            <span>College ID:</span>
                            <span className="break-all font-mono font-semibold text-foreground">
                              {student.collegeId}
                            </span>
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                          {student.email ? (
                            <span className="inline-flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
                              <Mail
                                size={13}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="break-all">{student.email}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No email provided
                            </span>
                          )}

                          <span
                            className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                              student.mustChangePassword
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            }`}
                          >
                            <ShieldCheck
                              size={12}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                            <span className="break-words">
                              {student.mustChangePassword
                                ? "Password change required"
                                : "Password change not required"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:pl-3">
                      <Link
                        href={`/supervisor/students/${student.id}`}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
                      >
                        View details
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting || isRefreshing}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Permanently delete this student account? Shared AI suggestions will remain.",
                            )
                          ) {
                            void handleDeleteStudent(student.id);
                          }
                        }}
                        aria-label={`Delete student ${student.name}`}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 size={15} aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">
                          {isDeleting ? "Deleting..." : "Delete"}
                        </span>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-5 sm:p-8">
              <EmptyState
                title={
                  debouncedQuery
                    ? "No matching students"
                    : "No student accounts yet"
                }
                description={
                  debouncedQuery
                    ? "Try a different name or college ID. You can also clear the search to see the full directory."
                    : "Create a student account to provide access to the platform and its visible project briefs and AI feature suggestions."
                }
              />

              {debouncedQuery && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="rounded-xl"
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-auto flex flex-col gap-3 border-t border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-center text-xs text-muted-foreground sm:text-left">
                Page{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {pagination.currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {pagination.totalPages}
                </span>
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !pagination.hasPreviousPage ||
                    isRefreshing
                  }
                  onClick={() =>
                    handlePageChange(pagination.currentPage - 1)
                  }
                  className="min-h-9 rounded-xl"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  Previous
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !pagination.hasNextPage ||
                    isRefreshing
                  }
                  onClick={() =>
                    handlePageChange(pagination.currentPage + 1)
                  }
                  className="min-h-9 rounded-xl"
                >
                  Next
                  <ChevronRight size={15} aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Create student account */}
        <section
          aria-labelledby="create-student-title"
          className="min-w-0 space-y-6 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7 xl:sticky xl:top-6"
        >
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <UserPlus size={22} aria-hidden="true" />
            </div>

            <div className="min-w-0 space-y-1">
              <h2
                id="create-student-title"
                className="text-lg font-bold tracking-tight sm:text-xl"
              >
                Create student account
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Register a student and initialize their sign-in credentials.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <p className="text-sm font-semibold text-foreground">
              How initial sign-in works
            </p>

            <ol className="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  1
                </span>
                <span>
                  The college ID becomes the student&apos;s login ID and initial
                  password.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  2
                </span>
                <span>
                  The student must change the initial password at first
                  sign-in.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  3
                </span>
                <span>
                  Share initial credentials only through a secure channel.
                </span>
              </li>
            </ol>
          </div>

          <form onSubmit={handleCreateStudent} className="space-y-5">
            <FormField
              label="Student full name"
              name="name"
              hint="Enter the name that should appear in the student directory."
            >
              <TextInput
                name="name"
                required
                minLength={2}
                maxLength={160}
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
              />
            </FormField>

            <FormField
              label="College ID"
              name="collegeId"
              hint="Used as the login ID and initial password. Follow your institution's existing ID format."
            >
              <TextInput
                name="collegeId"
                required
                minLength={2}
                maxLength={80}
                autoComplete="off"
                placeholder="Enter college ID"
              />
            </FormField>

            <FormField
              label="Email address"
              name="email"
              hint="Optional contact information."
            >
              <TextInput
                name="email"
                type="email"
                autoComplete="email"
                placeholder="student@university.edu"
              />
            </FormField>

            <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                The initial password is derived from the college ID. The
                application is responsible for securely hashing credentials
                before storage and enforcing the required first-login password
                change.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold shadow-sm"
            >
              {isCreating ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={17} aria-hidden="true" />
                  Create student account
                  <ArrowRight size={15} aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
