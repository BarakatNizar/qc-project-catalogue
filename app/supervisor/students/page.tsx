
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

import { t, type Locale } from "@/shared/i18n/dictionary";

const PAGE_SIZE = 10;

export default function StudentsPage() {
  const [locale, setLocale] = useState<Locale>("en");

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

  // Read the selected application language from the existing cookie.
  useEffect(() => {
    const languageCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("qc_locale"));

    const savedLocale = languageCookie?.split("=")[1];

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }
  }, []);

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
            notify.error(
              t(locale, "unableToLoadStudentsTitle"),
              res.error,
            );
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
            t(locale, "unableToLoadStudentAccountsDesc"),
          );
        } else {
          notify.error(
            t(locale, "unableToLoadStudentsTitle"),
            t(locale, "unexpectedErrorTryAgain"),
          );
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsRefreshing(false);
          setInitialLoading(false);
        }
      }
    },
    [locale],
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
        notify.error(
          t(locale, "failedToCreateStudentTitle"),
          res.error,
        );
        return;
      }

      notify.success(
        t(locale, "studentAccountCreatedTitle"),
        t(locale, "studentAccountCreatedDesc"),
      );

      form.reset();

      // Refresh using the currently settled directory query.
      await loadStudents(debouncedQuery, currentPage);
    } catch {
      notify.error(
        t(locale, "failedToCreateStudentTitle"),
        t(locale, "unexpectedErrorTryAgain"),
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
        notify.error(
          t(locale, "failedToDeleteStudentTitle"),
          res.error,
        );
        return;
      }

      notify.success(
        t(locale, "studentAccountDeletedTitle"),
        t(locale, "studentAccountDeletedDesc"),
      );

      // If deletion empties the current page, move back one page.
      const query = debouncedQuery;

      const updated = query
        ? await searchStudentsAction(query, currentPage, PAGE_SIZE)
        : await listStudentsAction(currentPage, PAGE_SIZE);

      if ("error" in updated) {
        notify.error(
          t(locale, "studentDeletedTitle"),
          t(locale, "studentDeletedRefreshError"),
        );
        return;
      }

      if (updated.data.length === 0 && currentPage > 1) {
        setCurrentPage((page) => Math.max(1, page - 1));
        return;
      }

      setStudents(updated.data);
      setPagination(updated.pagination);
    } catch {
      notify.error(
        t(locale, "failedToDeleteStudentTitle"),
        t(locale, "unexpectedErrorTryAgain"),
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
        aria-label={t(locale, "loadingStudentAccounts")}
      >
        <div className="space-y-3">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-56 max-w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_480px]">
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

        <span className="sr-only">
          {t(locale, "loadingStudentDirectory")}
        </span>
      </div>
    );
  }

  if (initialError) {
    return <ErrorState message={initialError} />;
  }

  const totalCount = pagination?.totalCount ?? students.length;

  return (
    <div className="mx-auto w-full space-y-6 pb-8 sm:space-y-8">
      <PageHeading
        eyebrow={t(locale, "studentAccountsEyebrow")}
        title={t(locale, "studentDirectoryTitle")}
        description={t(locale, "studentDirectoryDesc")}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_480px] xl:gap-6">
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
                  {t(locale, "allStudents")}
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t(locale, "studentDirectorySubDesc")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="text-lg text-muted-foreground"
                aria-live="polite"
              >
                <span className="font-semibold tabular-nums text-foreground">
                  {totalCount}
                </span>{" "}
                {t(
                  locale,
                  totalCount === 1
                    ? "studentAccountSingular"
                    : "studentAccountPlural",
                )}
                {searchQuery.trim() && (
                  <span className="break-words">
                    {" "}
                    {t(locale, "matchingPrefix")} &ldquo;
                    {searchQuery.trim()}&rdquo;
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
                  placeholder={t(locale, "searchByNameOrCollegeId")}
                  aria-label={t(locale, "searchStudentsAria")}
                  autoComplete="off"
                  className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-lg outline-none transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t(locale, "clearStudentSearch")}
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
              <span className="text-[16px] font-medium text-muted-foreground">
                {t(locale, "updatingStudentDirectory")}
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
                          className="block break-words text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
                        >
                          {student.name}
                        </Link>

                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[16px] text-muted-foreground">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Fingerprint
                              size={14}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                            <span>{t(locale, "collegeIdFieldLabel")}</span>
                            <span className="break-all font-mono font-semibold text-foreground">
                              {student.collegeId}
                            </span>
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                          {student.email ? (
                            <span className="inline-flex min-w-0 items-start gap-1.5 text-[16px] text-muted-foreground">
                              <Mail
                                size={13}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="break-all">{student.email}</span>
                            </span>
                          ) : (
                            <span className="text-[16px] text-muted-foreground">
                              {t(locale, "noEmailProvided")}
                            </span>
                          )}

                          <span
                            className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[14px] font-medium ${
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
                              {t(
                                locale,
                                student.mustChangePassword
                                  ? "passwordChangeRequired"
                                  : "passwordChangeNotRequired",
                              )}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:pl-3">
                      <Link
                        href={`/supervisor/students/${student.id}`}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[16px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
                      >
                        {t(locale, "viewDetails")}
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
                              t(locale, "deleteStudentConfirm"),
                            )
                          ) {
                            void handleDeleteStudent(student.id);
                          }
                        }}
                        aria-label={`${t(locale, "deleteStudentAriaLabel")} ${student.name}`}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-[16px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
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
                          {isDeleting
                            ? t(locale, "deleting")
                            : t(locale, "delete")}
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
                    ? t(locale, "noMatchingStudents")
                    : t(locale, "noStudentAccountsYet")
                }
                description={
                  debouncedQuery
                    ? t(locale, "noMatchingStudentsDesc")
                    : t(locale, "noStudentAccountsYetDesc")
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
                    {t(locale, "clearSearch")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-auto flex flex-col gap-3 border-t border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-center text-[16px] text-muted-foreground sm:text-left">
                {t(locale, "pageLabel")}{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {pagination.currentPage}
                </span>{" "}
                {t(locale, "ofLabel")}{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {pagination.totalPages}
                </span>
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage || isRefreshing}
                  onClick={() =>
                    handlePageChange(pagination.currentPage - 1)
                  }
                  className="min-h-9 rounded-xl"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  {t(locale, "previous")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || isRefreshing}
                  onClick={() =>
                    handlePageChange(pagination.currentPage + 1)
                  }
                  className="min-h-9 rounded-xl"
                >
                  {t(locale, "next")}
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
                {t(locale, "createStudentAccount")}
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t(locale, "createStudentAccountDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <p className="text-lg font-semibold text-foreground">
              {t(locale, "initialSignInHowItWorks")}
            </p>

            <ol className="space-y-2.5 text-[16px] leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
                  1
                </span>
                <span>{t(locale, "signInStep1")}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
                  2
                </span>
                <span>{t(locale, "signInStep2")}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
                  3
                </span>
                <span>{t(locale, "signInStep3")}</span>
              </li>
            </ol>
          </div>

          <form onSubmit={handleCreateStudent} className="space-y-5">
            <FormField
              label={t(locale, "studentFullNameLabel")}
              name="name"
              hint={t(locale, "studentFullNameHint")}
            >
              <TextInput
                name="name"
                required
                minLength={2}
                maxLength={160}
                autoComplete="name"
                placeholder={t(locale, "studentFullNamePlaceholder")}
              />
            </FormField>

            <FormField
              label={t(locale, "collegeIdFieldLabel").replace(/:$/, "")}
              name="collegeId"
              hint={t(locale, "collegeIdFormHint")}
            >
              <TextInput
                name="collegeId"
                required
                minLength={2}
                maxLength={80}
                autoComplete="off"
                placeholder={t(locale, "collegeIdPlaceholder")}
              />
            </FormField>

            <FormField
              label={t(locale, "emailAddressLabel")}
              name="email"
              hint={t(locale, "emailAddressHint")}
            >
              <TextInput
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t(locale, "emailAddressPlaceholder")}
              />
            </FormField>

            <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-[16px] leading-relaxed text-muted-foreground">
                {t(locale, "initialPasswordSecurityNote")}
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
                  {t(locale, "creatingAccount")}
                </>
              ) : (
                <>
                  <UserPlus size={17} aria-hidden="true" />
                  {t(locale, "createStudentAccount")}
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
