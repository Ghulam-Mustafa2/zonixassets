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
      `pakstore-audit-logs-${filterSuffix}${dateRangeSuffix}-${today}.csv`;

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
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-2xl font-bold"
            >
              Pak
              <span className="text-emerald-400">
                Store
              </span>
            </Link>

            <p className="mt-1 text-xs text-white/35">
              Admin Audit Logs
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/customers"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Customers
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Orders
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-emerald-400">
              Security
            </p>

            <h1 className="mt-2 text-4xl font-bold md:text-5xl">
              Audit Logs
            </h1>

            <p className="mt-3 max-w-3xl text-white/45">
              Review administrator actions for account
              suspension, activation and role changes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={
                exportFilteredLogsToCsv
              }
              disabled={
                loading ||
                filteredLogs.length === 0
              }
              className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={
                loadAuditLogs
              }
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "Refresh Logs"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total Logs"
            value={String(
              stats.totalLogs
            )}
            helper="Recorded admin actions"
          />

          <StatCard
            label="Suspended"
            value={String(
              stats.suspended
            )}
            helper="Accounts suspended"
            danger
          />

          <StatCard
            label="Activated"
            value={String(
              stats.activated
            )}
            helper="Accounts restored"
            emerald
          />

          <StatCard
            label="Promoted"
            value={String(
              stats.promotedToAdmin
            )}
            helper="Changed to ADMIN"
          />

          <StatCard
            label="Demoted"
            value={String(
              stats.changedToCustomer
            )}
            helper="Changed to CUSTOMER"
          />
        </section>

        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-3">
                <FilterButton
                  active={
                    filter === "ALL"
                  }
                  onClick={() =>
                    setFilter("ALL")
                  }
                >
                  All
                </FilterButton>

                <FilterButton
                  active={
                    filter ===
                    "ACCOUNT_SUSPENDED"
                  }
                  onClick={() =>
                    setFilter(
                      "ACCOUNT_SUSPENDED"
                    )
                  }
                >
                  Suspended
                </FilterButton>

                <FilterButton
                  active={
                    filter ===
                    "ACCOUNT_ACTIVATED"
                  }
                  onClick={() =>
                    setFilter(
                      "ACCOUNT_ACTIVATED"
                    )
                  }
                >
                  Activated
                </FilterButton>

                <FilterButton
                  active={
                    filter ===
                    "ROLE_CHANGED_TO_ADMIN"
                  }
                  onClick={() =>
                    setFilter(
                      "ROLE_CHANGED_TO_ADMIN"
                    )
                  }
                >
                  → Admin
                </FilterButton>

                <FilterButton
                  active={
                    filter ===
                    "ROLE_CHANGED_TO_CUSTOMER"
                  }
                  onClick={() =>
                    setFilter(
                      "ROLE_CHANGED_TO_CUSTOMER"
                    )
                  }
                >
                  → Customer
                </FilterButton>
              </div>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search admin, user, email, action..."
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-emerald-400/40 xl:max-w-md"
              />
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-white/40">
                    From Date
                  </span>

                  <input
                    type="date"
                    value={fromDate}
                    max={
                      toDate ||
                      undefined
                    }
                    onChange={(event) =>
                      setFromDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-white/40">
                    To Date
                  </span>

                  <input
                    type="date"
                    value={toDate}
                    min={
                      fromDate ||
                      undefined
                    }
                    onChange={(event) =>
                      setToDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setQuickDateRange(
                      1
                    )
                  }
                  className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuickDateRange(
                      7
                    )
                  }
                  className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  Last 7 Days
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuickDateRange(
                      30
                    )
                  }
                  className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  Last 30 Days
                </button>

                <button
                  type="button"
                  onClick={
                    clearDateFilters
                  }
                  disabled={
                    !fromDate &&
                    !toDate
                  }
                  className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear Dates
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm text-white/45">
                Sort
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(
                      event.target
                        .value as SortOrder
                    )
                  }
                  className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
                >
                  <option value="NEWEST">
                    Newest First
                  </option>

                  <option value="OLDEST">
                    Oldest First
                  </option>
                </select>
              </label>

              <button
                type="button"
                onClick={
                  clearAllFilters
                }
                className="w-fit rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-6 md:p-8">
            <p className="text-sm text-emerald-400">
              Activity
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Admin Activity
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Showing{" "}
              {
                filteredLogs.length
              }{" "}
              log
              {filteredLogs.length ===
              1
                ? ""
                : "s"}
              . CSV export uses the current action, search, date and sort filters.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-white/40">
              Loading audit logs...
            </div>
          ) : filteredLogs.length ===
            0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">
                No audit logs found.
              </p>

              <p className="mt-2 text-sm text-white/40">
                Admin account changes will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredLogs.map(
                (log) => (
                  <article
                    key={log.id}
                    className="p-6 md:p-8"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${actionClasses(
                              log.action
                            )}`}
                          >
                            {actionLabel(
                              log.action
                            )}
                          </span>

                          <span className="text-xs text-white/30">
                            {formatDate(
                              log.createdAt
                            )}
                          </span>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <PersonCard
                            label="Performed By"
                            person={
                              log.admin
                            }
                          />

                          <PersonCard
                            label="Target Account"
                            person={
                              log.targetUser
                            }
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
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold transition hover:bg-white/10 xl:w-auto"
                      >
                        View Customer
                      </Link>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <ValueCard
                        label="Previous Value"
                        value={
                          formatAuditValue(
                            log.oldValue
                          )
                        }
                      />

                      <ValueCard
                        label="New Value"
                        value={
                          formatAuditValue(
                            log.newValue
                          )
                        }
                        emerald
                      />
                    </div>

                    <p className="mt-5 break-all text-xs text-white/20">
                      Log ID: {log.id}
                    </p>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  helper,
  emerald = false,
  danger = false,
}: {
  label: string;
  value: string;
  helper: string;
  emerald?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-white/40">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          danger
            ? "text-red-300"
            : emerald
              ? "text-emerald-400"
              : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-3 text-xs text-white/25">
        {helper}
      </p>
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
          ? "rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black"
          : "rounded-xl border border-white/10 bg-black px-5 py-3 font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
      }
    >
      {children}
    </button>
  );
}

function PersonCard({
  label,
  person,
  showStatus = false,
}: {
  label: string;
  person:
    | AuditProfile
    | TargetProfile
    | null;
  showStatus?: boolean;
}) {
  if (!person) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black p-5">
        <p className="text-xs text-white/35">
          {label}
        </p>

        <p className="mt-2 text-sm text-white/40">
          Not available
        </p>
      </div>
    );
  }

  const target =
    person as TargetProfile;

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs text-white/35">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="font-semibold">
          {person.name}
        </p>

        {person.role && (
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-semibold text-purple-300">
            {person.role}
          </span>
        )}

        {showStatus &&
          typeof target.isActive ===
            "boolean" && (
            <span
              className={
                target.isActive
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300"
                  : "rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[10px] font-semibold text-red-300"
              }
            >
              {target.isActive
                ? "ACTIVE"
                : "SUSPENDED"}
            </span>
          )}
      </div>

      <p className="mt-2 text-sm text-white/40">
        {person.email ||
          "No email"}
      </p>

      <p className="mt-2 break-all text-xs text-white/20">
        ID: {person.id}
      </p>
    </div>
  );
}

function ValueCard({
  label,
  value,
  emerald = false,
}: {
  label: string;
  value: string;
  emerald?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs text-white/35">
        {label}
      </p>

      <p
        className={
          emerald
            ? "mt-2 text-sm font-medium leading-6 text-emerald-300"
            : "mt-2 text-sm font-medium leading-6 text-white/70"
        }
      >
        {value}
      </p>
    </div>
  );
}
