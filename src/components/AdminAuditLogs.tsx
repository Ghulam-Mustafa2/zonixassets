"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type AuditProfile = {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
};

type TargetProfile = AuditProfile & {
  isActive: boolean | null;
};

type AuditLog = {
  id: string;
  action: string;
  createdAt: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  admin: AuditProfile;
  targetUser: TargetProfile | null;
};

type AuditStats = {
  totalLogs: number;
  suspended: number;
  activated: number;
  promotedToAdmin: number;
  changedToCustomer: number;
};

type AuditLogsResponse = {
  success: boolean;
  stats: AuditStats;
  logs: AuditLog[];
  error?: string;
  code?: string;
};

type FilterType =
  | "ALL"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_ACTIVATED"
  | "ROLE_CHANGED_TO_ADMIN"
  | "ROLE_CHANGED_TO_CUSTOMER";

type SortOrder =
  | "NEWEST"
  | "OLDEST";

const emptyStats: AuditStats = {
  totalLogs: 0,
  suspended: 0,
  activated: 0,
  promotedToAdmin: 0,
  changedToCustomer: 0,
};

function formatDate(value: string) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }
  ).format(date);
}

function actionLabel(action: string) {
  switch (action) {
    case "ACCOUNT_SUSPENDED":
      return "Account Suspended";

    case "ACCOUNT_ACTIVATED":
      return "Account Activated";

    case "ROLE_CHANGED_TO_ADMIN":
      return "Promoted to Admin";

    case "ROLE_CHANGED_TO_CUSTOMER":
      return "Changed to Customer";

    default:
      return action
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        );
  }
}

function actionClasses(action: string) {
  switch (action) {
    case "ACCOUNT_SUSPENDED":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "ACCOUNT_ACTIVATED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "ROLE_CHANGED_TO_ADMIN":
      return "border-purple-400/20 bg-purple-400/10 text-purple-300";

    case "ROLE_CHANGED_TO_CUSTOMER":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

function formatAuditValue(
  value: Record<string, unknown> | null
) {
  if (!value) {
    return "—";
  }

  const entries =
    Object.entries(value);

  if (entries.length === 0) {
    return "—";
  }

  return entries
    .map(([key, rawValue]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replaceAll("_", " ")
        .trim()
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        );

      let displayValue = "";

      if (typeof rawValue === "boolean") {
        displayValue = rawValue
          ? "Active"
          : "Suspended";
      } else if (
        rawValue === null ||
        rawValue === undefined
      ) {
        displayValue = "—";
      } else {
        displayValue =
          String(rawValue);
      }

      return `${label}: ${displayValue}`;
    })
    .join(" • ");
}

function csvCell(
  value: string | number | null | undefined
) {
  let textValue =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  /*
    Prevent spreadsheet formula injection
    when CSV is opened in Excel/Sheets.
  */
  if (
    /^[=+\-@]/.test(
      textValue.trimStart()
    )
  ) {
    textValue =
      `'${textValue}`;
  }

  return `"${textValue.replaceAll(
    '"',
    '""'
  )}"`;
}

function csvDate(value: string) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toISOString();
}

export default function AdminAuditLogs() {
  const router = useRouter();

  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [stats, setStats] =
    useState<AuditStats>(
      emptyStats
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("ALL");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState<SortOrder>(
      "NEWEST"
    );

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/audit-logs",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as
          Partial<AuditLogsResponse>;

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (response.status === 403) {
        if (
          data.code ===
          "ACCOUNT_SUSPENDED"
        ) {
          router.replace("/login");
          router.refresh();
          return;
        }

        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load audit logs."
        );
      }

      setLogs(
        Array.isArray(data.logs)
          ? data.logs
          : []
      );

      setStats(
        data.stats ||
          emptyStats
      );
    } catch (loadError) {
      console.error(
        "ADMIN_AUDIT_LOGS_UI_ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const fromTime =
        fromDate
          ? new Date(
              `${fromDate}T00:00:00`
            ).getTime()
          : null;

      const toTime =
        toDate
          ? new Date(
              `${toDate}T23:59:59.999`
            ).getTime()
          : null;

      const result =
        logs.filter(
          (log) => {
          if (
            filter !== "ALL" &&
            log.action !== filter
          ) {
            return false;
          }

          const createdAt =
            new Date(
              log.createdAt
            ).getTime();

          if (
            fromTime !== null &&
            !Number.isNaN(
              createdAt
            ) &&
            createdAt < fromTime
          ) {
            return false;
          }

          if (
            toTime !== null &&
            !Number.isNaN(
              createdAt
            ) &&
            createdAt > toTime
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              log.action,
              actionLabel(log.action),
              log.admin.name,
              log.admin.email || "",
              log.targetUser?.name ||
                "",
              log.targetUser?.email ||
                "",
              log.targetUser?.id ||
                "",
              formatAuditValue(
                log.oldValue
              ),
              formatAuditValue(
                log.newValue
              ),
            ]
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );

      return result.sort(
        (a, b) => {
          const aTime =
            new Date(
              a.createdAt
            ).getTime();

          const bTime =
            new Date(
              b.createdAt
            ).getTime();

          if (
            Number.isNaN(aTime) ||
            Number.isNaN(bTime)
          ) {
            return 0;
          }

          return sortOrder ===
            "OLDEST"
            ? aTime - bTime
            : bTime - aTime;
        }
      );
    }, [
      logs,
      filter,
      search,
      fromDate,
      toDate,
      sortOrder,
    ]);

  function clearDateFilters() {
    setFromDate("");
    setToDate("");
  }

  function clearAllFilters() {
    setFilter("ALL");
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortOrder(
      "NEWEST"
    );
  }

  function setQuickDateRange(
    days: number
  ) {
    const end =
      new Date();

    const start =
      new Date();

    start.setDate(
      end.getDate() -
        (days - 1)
    );

    const toInputValue = (
      date: Date
    ) => {
      const local =
        new Date(
          date.getTime() -
            date.getTimezoneOffset() *
              60_000
        );

      return local
        .toISOString()
        .slice(0, 10);
    };

    setFromDate(
      toInputValue(start)
    );

    setToDate(
      toInputValue(end)
    );
  }

  function exportFilteredLogsToCsv() {
    if (
      filteredLogs.length === 0
    ) {
      setError(
        "There are no audit logs to export."
      );
      return;
    }

    setError("");

    const headers = [
      "Date / Time",
      "Action",
      "Admin Name",
      "Admin Email",
      "Admin ID",
      "Target Name",
      "Target Email",
      "Target ID",
      "Target Role",
      "Target Status",
      "Previous Value",
      "New Value",
      "Log ID",
    ];

    const rows =
      filteredLogs.map(
        (log) => [
          csvDate(
            log.createdAt
          ),
          actionLabel(
            log.action
          ),
          log.admin.name,
          log.admin.email || "",
          log.admin.id,
          log.targetUser?.name ||
            "",
          log.targetUser?.email ||
            "",
          log.targetUser?.id ||
            "",
          log.targetUser?.role ||
            "",
          typeof log.targetUser
            ?.isActive ===
          "boolean"
            ? log.targetUser
                .isActive
              ? "ACTIVE"
              : "SUSPENDED"
            : "",
          formatAuditValue(
            log.oldValue
          ),
          formatAuditValue(
            log.newValue
          ),
          log.id,
        ]
      );

    const csv =
      [
        headers,
        ...rows,
      ]
        .map((row) =>
          row
            .map((cell) =>
              csvCell(cell)
            )
            .join(",")
        )
        .join("\r\n");

    const blob =
      new Blob(
        [
          "\uFEFF",
          csv,
        ],
        {
          type:
            "text/csv;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const filterSuffix =
      filter === "ALL"
        ? "all"
        : filter
            .toLowerCase()
            .replaceAll(
              "_",
              "-"
            );

    const dateRangeSuffix =
      fromDate || toDate
        ? `-${fromDate || "start"}-to-${toDate || "end"}`
        : "";

    link.href = url;
    link.download =
      `zonixassets-audit-logs-${filterSuffix}${dateRangeSuffix}-${today}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );
  }


  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#091426]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1226]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#091426] shadow-sm"
              aria-label="Admin dashboard"
            >
              Z
            </Link>

            <div className="min-w-0">
              <Link
                href="/admin"
                className="block truncate text-lg font-black tracking-tight"
              >
                Zonix<span className="text-cyan-400">Assets</span>
              </Link>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                Admin audit logs
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <AdminNav href="/admin">Dashboard</AdminNav>
            <AdminNav href="/admin/orders">Orders</AdminNav>
            <AdminNav href="/admin/customers">Customers</AdminNav>
            <AdminNav href="/admin/analytics">Analytics</AdminNav>
          </nav>

          <Link
            href="/"
            className="shrink-0 rounded-2xl bg-[#ff650f] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(255,101,15,0.22)] transition hover:-translate-y-0.5"
          >
            View Store
          </Link>
        </div>

        <div className="overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            <AdminNav href="/admin">Dashboard</AdminNav>
            <AdminNav href="/admin/orders">Orders</AdminNav>
            <AdminNav href="/admin/customers">Customers</AdminNav>
            <AdminNav href="/admin/analytics">Analytics</AdminNav>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#091426] text-white">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#ff650f]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1500px] gap-7 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-300">
              <span className="h-2 w-2 rounded-full bg-[#ff650f]" />
              Security center
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Admin activity,
              <span className="block text-white/45">kept clear and traceable.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">
              Review account suspension, activation and role changes from one
              searchable audit history.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={exportFilteredLogsToCsv}
                disabled={loading || filteredLogs.length === 0}
                className="rounded-2xl bg-[#ff650f] px-5 py-3 text-sm font-black text-white shadow-[0_12px_35px_rgba(255,101,15,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={loadAuditLogs}
                disabled={loading}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Logs"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:self-end">
            <HeroMetric label="Total logs" value={String(stats.totalLogs)} wide />
            <HeroMetric label="Suspended" value={String(stats.suspended)} />
            <HeroMetric label="Activated" value={String(stats.activated)} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {error && (
          <div className="mb-7 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section>
          <SectionHeading
            eyebrow="Security overview"
            title="Audit activity"
            description="A quick snapshot of administrator account actions."
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Total logs"
              value={String(stats.totalLogs)}
              helper="Recorded admin actions"
              accent="navy"
            />
            <StatCard
              label="Suspended"
              value={String(stats.suspended)}
              helper="Accounts suspended"
              accent="red"
            />
            <StatCard
              label="Activated"
              value={String(stats.activated)}
              helper="Accounts restored"
              accent="green"
            />
            <StatCard
              label="Promoted"
              value={String(stats.promotedToAdmin)}
              helper="Changed to ADMIN"
              accent="purple"
            />
            <StatCard
              label="Demoted"
              value={String(stats.changedToCustomer)}
              helper="Changed to CUSTOMER"
              accent="cyan"
            />
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
                Filters
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Find an audit event
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Filter by action, person, date or sort order.
              </p>
            </div>

            <div className="w-full xl:max-w-xl">
              <label className="mb-2 block text-xs font-bold text-slate-500">
                Search
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search admin, user, email, action..."
                className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-slate-300 focus:border-[#ff650f] focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto border-t border-slate-100 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>
              All
            </FilterButton>
            <FilterButton
              active={filter === "ACCOUNT_SUSPENDED"}
              onClick={() => setFilter("ACCOUNT_SUSPENDED")}
            >
              Suspended
            </FilterButton>
            <FilterButton
              active={filter === "ACCOUNT_ACTIVATED"}
              onClick={() => setFilter("ACCOUNT_ACTIVATED")}
            >
              Activated
            </FilterButton>
            <FilterButton
              active={filter === "ROLE_CHANGED_TO_ADMIN"}
              onClick={() => setFilter("ROLE_CHANGED_TO_ADMIN")}
            >
              → Admin
            </FilterButton>
            <FilterButton
              active={filter === "ROLE_CHANGED_TO_CUSTOMER"}
              onClick={() => setFilter("ROLE_CHANGED_TO_CUSTOMER")}
            >
              → Customer
            </FilterButton>
          </div>

          <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-[1fr_1fr_auto]">
            <label>
              <span className="mb-2 block text-xs font-bold text-slate-500">
                From date
              </span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#ff650f] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-bold text-slate-500">
                To date
              </span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#ff650f] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-bold text-slate-500">
                Sort
              </span>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as SortOrder)
                }
                className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#ff650f] focus:ring-4 focus:ring-orange-100 lg:min-w-[170px]"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto border-t border-slate-100 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <PresetButton onClick={() => setQuickDateRange(1)}>Today</PresetButton>
            <PresetButton onClick={() => setQuickDateRange(7)}>
              Last 7 Days
            </PresetButton>
            <PresetButton onClick={() => setQuickDateRange(30)}>
              Last 30 Days
            </PresetButton>
            <PresetButton
              onClick={clearDateFilters}
              disabled={!fromDate && !toDate}
            >
              Clear Dates
            </PresetButton>
            <PresetButton onClick={clearAllFilters} danger>
              Clear All Filters
            </PresetButton>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
                Activity
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Admin activity
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Showing {filteredLogs.length} log
                {filteredLogs.length === 1 ? "" : "s"}. CSV export uses the
                current filters and sort order.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">
              {filteredLogs.length} result{filteredLogs.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-400">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 sm:p-14">
              <EmptyState
                title="No audit logs found"
                text="Try changing the filters, search term or date range."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <article key={log.id} className="p-5 sm:p-7">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-black ${actionClassesLight(
                            log.action
                          )}`}
                        >
                          {actionLabel(log.action)}
                        </span>

                        <span className="text-xs font-medium text-slate-400">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <PersonCard
                          label="Performed by"
                          person={log.admin}
                        />
                        <PersonCard
                          label="Target account"
                          person={log.targetUser}
                          showStatus
                        />
                      </div>
                    </div>

                    <Link
                      href={
                        log.targetUser
                          ? `/admin/customers/${log.targetUser.id}`
                          : "/admin/customers"
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-5 py-3 text-center text-sm font-black transition hover:border-[#ff650f] hover:text-[#ff650f] xl:w-auto"
                    >
                      View Customer
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <ValueCard
                      label="Previous value"
                      value={formatAuditValue(log.oldValue)}
                    />
                    <ValueCard
                      label="New value"
                      value={formatAuditValue(log.newValue)}
                      accent
                    />
                  </div>

                  <p className="mt-4 break-all text-[11px] font-medium text-slate-300">
                    Log ID: {log.id}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminNav({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}

function HeroMetric({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black">{value}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff650f]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent = "navy",
}: {
  label: string;
  value: string;
  helper: string;
  accent?: "navy" | "red" | "green" | "purple" | "cyan";
}) {
  const accentStyles = {
    navy: "bg-slate-100 text-[#091426]",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-violet-50 text-violet-700",
    cyan: "bg-cyan-50 text-cyan-700",
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-base font-black ${accentStyles[accent]}`}
      >
        ✦
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{helper}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 rounded-xl bg-[#091426] px-4 py-2.5 text-sm font-black text-white"
          : "shrink-0 rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-black text-slate-600 transition hover:border-[#ff650f] hover:text-[#ff650f]"
      }
    >
      {children}
    </button>
  );
}

function PresetButton({
  children,
  onClick,
  danger = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-slate-200 bg-[#f8fafc] text-slate-600 hover:border-[#ff650f] hover:text-[#ff650f]"
      }`}
    >
      {children}
    </button>
  );
}

function actionClassesLight(action: string) {
  switch (action) {
    case "ACCOUNT_SUSPENDED":
      return "border-red-200 bg-red-50 text-red-700";
    case "ACCOUNT_ACTIVATED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ROLE_CHANGED_TO_ADMIN":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "ROLE_CHANGED_TO_CUSTOMER":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function PersonCard({
  label,
  person,
  showStatus = false,
}: {
  label: string;
  person: AuditProfile | TargetProfile | null;
  showStatus?: boolean;
}) {
  if (!person) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Not available
        </p>
      </div>
    );
  }

  const target = person as TargetProfile;

  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
      <p className="text-xs font-bold text-slate-400">{label}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="font-black text-[#091426]">{person.name}</p>

        {person.role && (
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">
            {person.role}
          </span>
        )}

        {showStatus && typeof target.isActive === "boolean" && (
          <span
            className={
              target.isActive
                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700"
                : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700"
            }
          >
            {target.isActive ? "ACTIVE" : "SUSPENDED"}
          </span>
        )}
      </div>

      <p className="mt-2 break-all text-sm text-slate-500">
        {person.email || "No email"}
      </p>
      <p className="mt-2 break-all text-[11px] text-slate-300">
        ID: {person.id}
      </p>
    </div>
  );
}

function ValueCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p
        className={`mt-2 text-sm font-semibold leading-6 ${
          accent ? "text-emerald-700" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#f8fafc] px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl text-[#ff650f]">
        ✦
      </div>
      <p className="mt-4 font-black text-[#091426]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {text}
      </p>
    </div>
  );
}
