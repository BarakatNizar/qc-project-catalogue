
"use client";

import { useCallback, useEffect, useRef, useState } from "react"; import Link from "next/link";
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

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
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

function formatCreatedDate(value: string | Date): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function SupervisorsPage() {
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
            notify.error("Unable to load supervisors", result.error);
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

        const message = getErrorMessage(error);

        if (isInitial) {
          setInitialError(message);
        } else {
          notify.error("Unable to load supervisors", message);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
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
        notify.error("Failed to create supervisor", result.error);
        return;
      }

      notify.success(
        "Supervisor account created",
        "Credentials have been successfully initialized.",
      );

      setName("");
      setLoginId("");
      setEmail("");
      setPassword("");

      await loadDirectory(searchQuery.trim(), currentPage);
    } catch (error) {
      notify.error("Failed to create supervisor", getErrorMessage(error));
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
        notify.error("Failed to delete supervisor", result.error);
        return;
      }

      notify.success(
        "Supervisor account removed",
        "Students remain and their supervisor association is cleared.",
      );

      await loadDirectory(searchQuery.trim(), currentPage);
    } catch (error) {
      notify.error("Failed to delete supervisor", getErrorMessage(error));
    } finally {
      setIsMutating(false);
    }
  }

  if (initialLoading) {
    return (
      <main
        className="flex min-h-80 items-center justify-center px-4 py-12"
        aria-label="Loading supervisor directory"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Loader2 className="size-7 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">Loading supervisor directory</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Retrieving supervisor accounts and pagination details.
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
        eyebrow="Access management"
        title="Supervisors"
        description="Create and maintain QC Supervisor accounts. Every Supervisor can manage all students and all project briefs."
      />

      {/* Page context */}
      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              Supervisor accounts
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
            <p className="text-xs text-muted-foreground">Account management</p>
            <p className="mt-1 text-sm font-semibold">Administrator controlled</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Directory view</p>
            <p className="mt-1 text-sm font-semibold">
              {searchQuery.trim() ? "Search results" : "All supervisors"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
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
                    Supervisor directory
                  </h2>
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                    {totalCount} {totalCount === 1 ? "account" : "accounts"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Search accounts by supervisor name or login ID, then manage
                  individual records.
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">
                  Search supervisors by name or login ID
                </span>
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search by name or login ID..."
                  maxLength={160}
                  className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background pl-10 pr-10 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Clear supervisor search"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <span className="shrink-0 text-xs text-muted-foreground sm:text-right">
                {PAGE_SIZE} accounts per page
              </span>
            </div>
          </div>

          {isRefreshing ? (
            <div
              className="flex items-center gap-2 border-b border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground sm:px-6"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="size-4 animate-spin text-primary"
                aria-hidden="true"
              />
              Updating directory…
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
                          className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-xs font-bold tracking-wide text-primary"
                          aria-hidden="true"
                        >
                          {getInitials(supervisor.name) || "S"}
                        </span>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold leading-5">
                              {supervisor.name}
                            </h3>
                            <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                              Login ID:{" "}
                              <span className="font-medium text-foreground/80">
                                {supervisor.loginId}
                              </span>
                            </p>
                          </div>

                          {supervisor.email ? (
                            <p className="flex min-w-0 items-start gap-1.5 break-words text-xs leading-5 text-muted-foreground">
                              <Mail
                                className="mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 break-all">
                                {supervisor.email}
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/70">
                              No email address provided
                            </p>
                          )}

                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays
                              className="size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            Created {formatCreatedDate(supervisor.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 flex-wrap gap-2 border-t border-border/60 pt-3 sm:justify-end lg:w-auto lg:border-t-0 lg:pt-0">
                        <Link
                          href={`/admin/supervisors/${supervisor.id}`}
                          aria-label={`Edit ${supervisor.name}`}
                          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-none"
                        >
                          Edit details
                        </Link>

                        <ConfirmDialog
                          title="Permanently delete this Supervisor account?" style="warn" onCertain={() => handleDeleteSupervisor(supervisor.id)}
                          triggerChildren={isMutating ? (
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2
                              className="size-5 hover:scale-[1.1] duration-200 text-warning"
                              aria-hidden="true"
                            />
                          )} />
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
                    ? "No supervisors match your search"
                    : "No supervisors found"
                }
                description={
                  searchQuery.trim()
                    ? "Try a different name or login ID, or clear your search to view the full directory."
                    : "Create a supervisor account using the form to get started."
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
                    Clear search
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 ? (
            <nav
              aria-label="Supervisor directory pagination"
              className="flex flex-col gap-3 border-t border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <p className="text-center text-xs text-muted-foreground sm:text-left">
                Page{" "}
                <span className="font-semibold text-foreground">
                  {pagination.currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {pagination.totalPages}
                </span>
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage || isRefreshing || isMutating}
                  onClick={() =>
                    handlePageChange(pagination.currentPage - 1)
                  }
                  className="min-w-24 flex-1 rounded-xl sm:flex-none"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || isRefreshing || isMutating}
                  onClick={() =>
                    handlePageChange(pagination.currentPage + 1)
                  }
                  className="min-w-24 flex-1 rounded-xl sm:flex-none"
                >
                  Next
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
                    Create supervisor
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Set up a new supervisor account with its own login
                    credentials.
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
                <p className="text-xs leading-5 text-muted-foreground">
                  Supervisors can manage all students and all project briefs.
                  Share initial credentials securely with the intended
                  account holder.
                </p>
              </div>
              <div className="min-w-0 space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-name"
                    className="text-sm font-medium"
                  >
                    Full name *
                  </label>
                  <input
                    id="supervisor-name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={160}
                    autoComplete="name"
                    placeholder="Supervisor name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {/* Login Id */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-login-id"
                    className="text-sm font-medium"
                  >
                    Login ID *
                  </label>
                  <p className="text-xs text-muted-foreground">
                    The identifier the supervisor will use to sign in.
                  </p>
                  <input
                    id="supervisor-login-id"
                    name="loginId"
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    autoComplete="off"
                    placeholder="e.g. 202110878"
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-password"
                    className="text-sm font-medium"
                  >
                    Temporary password *
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Use at least 9 characters. QC does not automatically generate or email passwords.
                  </p>
                  <input
                    id="supervisor-password"
                    name="password"
                    type="password"
                    required
                    minLength={9}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Enter a temporary password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="supervisor-email"
                    className="text-sm font-medium"
                  >
                    Email address
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Optional. No email delivery is implied by entering an address.
                  </p>
                  <input
                    id="supervisor-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isMutating}
                    className="h-11 w-full min-w-0 rounded-xl border border-border/80 bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex items-start gap-2 border-t border-border/70 pt-4 text-xs leading-5 text-muted-foreground">
                  <Clock3
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p>
                    Verify the login ID and share the initial password
                    securely after the account has been created.
                  </p>
                </div>

                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() => void handleCreateSupervisor()}
                  className="w-full rounded-xl font-semibold"
                >
                  {isMutating ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  {isMutating ? "Processing…" : "Create supervisor account"}
                </Button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
