
// /admin/supervisors/page.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Loader2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  listSupervisorsAction,
  searchSupervisorsAction,
} from "@/Interfaces/getters/user.getters";
import {
  createSupervisorAction,
  deleteSupervisorAction,
} from "@/Interfaces/actions/users.actions";
import type { UserDto } from "@/modules/user/mappers/user-mapper";
import type { PaginationMeta } from "@/shared/utils/pagincation-utils";
import type { CreateSupervisorPayload } from "@/shared/validation/user";
import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { APPLICATION_LANGUAGE_COOKIE } from "@/modules/translation/constants/language.constants";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, locale: Locale): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return t(locale, "unexpectedErrorTryAgain");
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatCreatedDate(value: string | Date, locale: Locale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t(locale, "dateUnavailable");
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function SupervisorsPage() {
  const [locale, setLocale] = useState<Locale>("en");

  // Read the application language from the qc_locale cookie.
  useEffect(() => {
    const languageCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("qc_locale"));
    // console.log(document)
    const cookieValue = languageCookie?.split("=")[1];
    setLocale(cookieValue === "ar" ? "ar" : "en");
  }, []);

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [supervisors, setSupervisors] = useState<UserDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const requestIdRef = useRef(0);
  const hasStartedInitialLoadRef = useRef(false);

  const totalCount = pagination?.totalCount ?? supervisors.length;

  const loadDirectory = useCallback(
    async (query: string, page: number, isInitial = false) => {
      const requestId = ++requestIdRef.current;

      if (isInitial) {
        setInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const result = query.trim()
          ? await searchSupervisorsAction(query.trim(), page, PAGE_SIZE)
          : await listSupervisorsAction(page, PAGE_SIZE);

        // Do not let an older request overwrite more recent search results.
        if (requestId !== requestIdRef.current) {
          return;
        }

        if ("error" in result) {
          if (isInitial) {
            setInitialError(result.error);
          } else {
            notify.error(
              t(locale, "unableToLoadSupervisorsError"),
              result.error,
            );
          }

          return;
        }

        setSupervisors(result.data);
        setPagination(result.pagination);
        setInitialError(null);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message = getErrorMessage(error, locale);

        if (isInitial) {
          setInitialError(message);
        } else {
          notify.error(t(locale, "unableToLoadSupervisorsError"), message);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [locale],
  );

  // Load the initial directory and fetch whenever the settled query or page changes.
  useEffect(() => {
    const isInitial = !hasStartedInitialLoadRef.current;
    hasStartedInitialLoadRef.current = true;

    void loadDirectory(debouncedQuery, currentPage, isInitial);

    return () => {
      // Invalidate the request if this effect is replaced or the page unmounts.
      requestIdRef.current += 1;
    };
  }, [debouncedQuery, currentPage, loadDirectory]);

  // Debounce typing to avoid sending a request for every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
  }

  function handlePageChange(page: number) {
    if (isRefreshing || isMutating) return;
    if (page < 1) return;
    if (pagination && page > pagination.totalPages) return;
    if (page === currentPage) return;

    setCurrentPage(page);
  }

  async function handleCreateSupervisor() {
    if (isMutating) return;

    const payload: CreateSupervisorPayload = {
      name: name.trim(),
      loginId: loginId.trim(),
      email: email.trim() ?? undefined,
      password,
    };

    setIsMutating(true);

    try {
      const result = await createSupervisorAction(payload);

      if ("error" in result) {
        notify.error(
          t(locale, "failedToCreateSupervisorError"),
          result.error,
        );
        return;
      }

      notify.success(
        t(locale, "supervisorAccountCreatedSuccessTitle"),
        t(locale, "supervisorAccountCreatedSuccessDesc"),
      );

      setName("");
      setLoginId("");
      setEmail("");
      setPassword("");

      await loadDirectory(searchQuery.trim(), currentPage);
    } catch (error) {
      notify.error(
        t(locale, "failedToCreateSupervisorError"),
        getErrorMessage(error, locale),
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteSupervisor(supervisorId: string) {
    if (isMutating) return;
    setIsMutating(true);

    try {
      const result = await deleteSupervisorAction(supervisorId);

      if ("error" in result) {
        notify.error(
          t(locale, "failedToDeleteSupervisorError"),
          result.error,
        );
        return;
      }

      notify.success(
        t(locale, "deleteSupervisorSuccessTitle"),
        t(locale, "deleteSupervisorSuccessDesc"),
      );

      await loadDirectory(searchQuery.trim(), currentPage);
    } catch (error) {
      notify.error(
        t(locale, "failedToDeleteSupervisorError"),
        getErrorMessage(error, locale),
      );
    } finally {
      setIsMutating(false);
    }
  }

  if (initialLoading) {
    return (
      <main
        className="flex min-h-80 items-center justify-center px-4 py-12"
        aria-label={t(locale, "loadingSupervisorDirectory")}
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Loader2 className="size-7 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">
              {t(locale, "loadingSupervisorDirectory")}
            </p>
            <p className="mt-1 text-lg text-muted-foreground font-semibold">
              {t(locale, "retrievingSupervisorAccountsDesc")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (initialError) {
    return <ErrorState message={initialError} />;
  }

  return (
    <main className="min-w-0 space-y-6 sm:space-y-8">
      <PageHeading
        eyebrow={t(locale, "accessManagementEyebrow")}
        title={t(locale, "supervisorsTitle")}
        description={t(locale, "supervisorsPageDesc")}
      />

      {/* Page context */}
      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] text-muted-foreground font-semibold">
              {t(locale, "supervisorAccountsMetric")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {totalCount}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] text-muted-foreground font-semibold">
              {t(locale, "accountManagementMetric")}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {t(locale, "administratorControlled")}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] text-muted-foreground font-semibold">
              {t(locale, "directoryViewMetric")}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {searchQuery.trim()
                ? t(locale, "searchResultsView")
                : t(locale, "allSupervisorsView")}
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-6">
        {/* Supervisor directory */}
        <section
          aria-labelledby="supervisor-directory-heading"
          className="min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
        >
          <div className="space-y-4 border-b border-border/70 p-4 sm:p-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="supervisor-directory-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    {t(locale, "supervisorDirectoryTitle")}
                  </h2>
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[15px] font-medium tabular-nums text-muted-foreground font-semibold">
                    {totalCount}{" "}
                    {t(
                      locale,
                      totalCount === 1 ? "accountSingular" : "accountPlural",
                    )}
                  </span>
                </div>
                <p className="mt-1 text-lg leading-5 text-muted-foreground font-semibold">
                  {t(locale, "supervisorDirectoryDesc")}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">
                  {t(locale, "searchByNameOrLoginIdPlaceholder")}
                </span>
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground font-semibold"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder={t(locale, "searchByNameOrLoginIdPlaceholder")}
                  maxLength={160}
                  className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background pl-10 pr-10 text-lg outline-none transition placeholder:text-muted-foreground font-semibold/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label={t(locale, "clearSupervisorSearchAria")}
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground font-semibold transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <span className="shrink-0 text-[15px] text-muted-foreground font-semibold sm:text-right">
                {PAGE_SIZE} {t(locale, "accountsPerPage")}
              </span>
            </div>
          </div>

          {isRefreshing ? (
            <div
              className="flex items-center gap-2 border-b border-primary/10 bg-primary/5 px-4 py-3 text-lg text-muted-foreground font-semibold sm:px-6"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="size-4 animate-spin text-primary"
                aria-hidden="true"
              />
              {t(locale, "updatingDirectory")}
            </div>
          ) : null}

          {supervisors.length > 0 ? (
            <div
              className={isRefreshing ? "opacity-70 transition-opacity" : ""}
              aria-busy={isRefreshing}
            >
              <ul className="divide-y divide-border/60">
                {supervisors.map((supervisor) => (
                  <li key={supervisor.id} className="min-w-0">
                    <article className="flex min-w-0 flex-col gap-4 p-4 transition-colors hover:bg-muted/20 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <span
                          className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-[15px] font-bold tracking-wide text-primary"
                          aria-hidden="true"
                        >
                          {getInitials(supervisor.name) || "S"}
                        </span>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-semibold leading-5">
                              {supervisor.name}
                            </h3>
                            <p className="mt-1 break-words text-[15px] leading-5 text-muted-foreground font-semibold">
                              {t(locale, "loginIdPrefix")}
                              <span className="font-medium text-foreground/80">
                                {supervisor.loginId}
                              </span>
                            </p>
                          </div>

                          {supervisor.email ? (
                            <p className="flex min-w-0 items-start gap-1.5 break-words text-[15px] leading-5 text-muted-foreground font-semibold">
                              <Mail
                                className="mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 break-all">
                                {supervisor.email}
                              </span>
                            </p>
                          ) : (
                            <p className="text-[15px] text-muted-foreground font-semibold">
                              {t(locale, "noEmailProvidedText")}
                            </p>
                          )}

                          <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground font-semibold">
                            <CalendarDays
                              className="size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            {t(locale, "createdDatePrefix")}
                            {formatCreatedDate(supervisor.createdAt, locale)}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 flex-wrap gap-2 border-t border-border/60 pt-3 sm:justify-end lg:w-auto lg:border-t-0 lg:pt-0">
                        <Link
                          href={`/admin/supervisors/${supervisor.id}`}
                          aria-label={`${t(locale, "editDetailsButton")} ${supervisor.name}`}
                          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-[15px] font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-none"
                        >
                          {t(locale, "editDetailsButton")}
                        </Link>

                        <ConfirmDialog
                          title={t(locale, "deleteSupervisorConfirmTitle")}
                          style="warn"
                          onCertain={() =>
                            handleDeleteSupervisor(supervisor.id)
                          }
                          triggerChildren={
                            isMutating ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Trash2
                                className="size-5 text-warning duration-200 hover:scale-[1.1]"
                                aria-hidden="true"
                              />
                            )
                          }
                        />
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <EmptyState
                title={
                  searchQuery.trim()
                    ? t(locale, "noMatchingSupervisors")
                    : t(locale, "noSupervisorsFound")
                }
                description={
                  searchQuery.trim()
                    ? t(locale, "noMatchingSupervisorsDesc")
                    : t(locale, "noSupervisorsFoundDesc")
                }
              />
              {searchQuery.trim() ? (
                <div className="mt-3 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearchChange("")}
                    className="rounded-xl"
                  >
                    <X className="size-4" aria-hidden="true" />
                    {t(locale, "clearSearchButton")}
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 ? (
            <nav
              aria-label={t(locale, "supervisorDirectoryPaginationAria")}
              className="flex flex-col gap-3 border-t border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <p className="text-center text-[15px] text-muted-foreground font-semibold sm:text-left">
                {t(locale, "pageIndicator")}{" "}
                <span className="font-semibold text-foreground">
                  {pagination.currentPage}
                </span>{" "}
                {t(locale, "ofIndicator")}{" "}
                <span className="font-semibold text-foreground">
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
                    isRefreshing ||
                    isMutating
                  }
                  onClick={() =>
                    handlePageChange(pagination.currentPage - 1)
                  }
                  className="min-w-24 flex-1 rounded-xl sm:flex-none"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {t(locale, "previousPageButton")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !pagination.hasNextPage || isRefreshing || isMutating
                  }
                  onClick={() =>
                    handlePageChange(pagination.currentPage + 1)
                  }
                  className="min-w-24 flex-1 rounded-xl sm:flex-none"
                >
                  {t(locale, "nextPageButton")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </nav>
          ) : null}
        </section>

        {/* Create supervisor */}
        <aside className="min-w-0 xl:sticky xl:top-6">
          <section
            aria-labelledby="create-supervisor-heading"
            className="min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
          >
            <div className="border-b border-border/70 bg-primary/[0.04] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <UserPlus className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="create-supervisor-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    {t(locale, "createSupervisorCardTitle")}
                  </h2>
                  <p className="mt-1 text-lg leading-5 text-muted-foreground font-semibold">
                    {t(locale, "createSupervisorCardDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/30 p-3.5">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-[15px] leading-5 text-muted-foreground font-semibold">
                  {t(locale, "supervisorPermissionsNotice")}
                </p>
              </div>

              <div className="min-w-0 space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-name"
                    className="text-lg font-medium"
                  >
                    {t(locale, "fullNameRequiredLabel")}
                  </label>
                  <input
                    id="supervisor-name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="name"
                    placeholder={t(locale, "supervisorNamePlaceholder")}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-md outline-none transition placeholder:text-muted-foreground font-semibold/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Login Id */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-login-id"
                    className="text-lg font-medium"
                  >
                    {t(locale, "loginIdRequiredLabel")}
                  </label>
                  <p className="text-[15px] text-muted-foreground font-semibold">
                    {t(locale, "loginIdHelperText")}
                  </p>
                  <input
                    id="supervisor-login-id"
                  dir="ltr"
                    name="loginId"
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    autoComplete="off"
                    placeholder={t(locale, "loginIdPlaceholderExample")}
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-md outline-none transition placeholder:text-muted-foreground font-semibold/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-password"
                    className="text-lg font-medium"
                  >
                    {t(locale, "temporaryPasswordRequiredLabel")}
                  </label>
                  <p className="text-[15px] text-muted-foreground font-semibold">
                    {t(locale, "temporaryPasswordHelperText")}
                  </p>
                  <input
                    id="supervisor-password"
                    name="password"
                    type="password"
                    required
                    minLength={9}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder={t(locale, "temporaryPasswordPlaceholderText")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-md outline-none transition placeholder:text-muted-foreground font-semibold/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-email"
                    className="text-lg font-medium"
                  >
                    {t(locale, "emailAddressLabel")}
                  </label>
                  <p className="text-[15px] text-muted-foreground font-semibold">
                    {t(locale, "emailAddressHelperText")}
                  </p>
                  <input
                  dir="ltr"
                    id="supervisor-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t(locale, "emailAddressPlaceholderExample")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-md outline-none transition placeholder:text-muted-foreground font-semibold/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex items-start gap-2 border-t border-border/70 pt-4 text-[15px] leading-5 text-muted-foreground font-semibold">
                  <Clock3
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p>{t(locale, "verifyLoginIdSecurityNotice")}</p>
                </div>

                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() => void handleCreateSupervisor()}
                  className="w-full rounded-xl font-semibold text-md"
                >
                  {isMutating ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  {isMutating
                    ? t(locale, "processingButton")
                    : t(locale, "createSupervisorAccountButton")}
                </Button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
