"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
};

type OrderItem = {
  id?: string;
  productId?: string;
  productTitle: string;
  productPrice?: number;
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type DownloadItem = {
  id: string;
  productId?: string;
  title: string;
  type?: string;
  downloadUrl?: string | null;
  downloadCount?: number;
  maxDownloads?: number;
  expiresAt?: string | null;
};

type DashboardStats = {
  totalPurchases: number;
  availableDownloads: number;
  lifetimeSpent: number;
};

type DashboardResponse = {
  success?: boolean;
  user?: AuthUser;
  stats?: DashboardStats;
  orders?: Order[];
  downloads?: DownloadItem[];
  error?: string;
};

const emptyStats: DashboardStats = {
  totalPurchases: 0,
  availableDownloads: 0,
  lifetimeSpent: 0,
};

const tabs = ["Overview", "Orders", "Downloads", "Profile", "Security"] as const;
type TabName = (typeof tabs)[number];

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatExpiryDate(value?: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusClasses(status: string) {
  const normalizedStatus = status?.toUpperCase();

  if (normalizedStatus === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalizedStatus === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalizedStatus === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (normalizedStatus === "REFUNDED") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function TabIcon({ name }: { name: TabName }) {
  const common = "h-4 w-4";

  if (name === "Overview") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === "Orders") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M7 4h10l2 3v13H5V7l2-3Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "Downloads") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "Profile") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function AccountDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabName>("Overview");

  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const sessionResponse = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const sessionData = await sessionResponse.json();

        if (sessionResponse.status === 403 && sessionData?.code === "ACCOUNT_SUSPENDED") {
          router.replace("/login");
          router.refresh();
          return;
        }

        if (!sessionResponse.ok || !sessionData?.authenticated || !sessionData?.user) {
          router.replace("/login");
          router.refresh();
          return;
        }

        setUser(sessionData.user);

        const dashboardResponse = await fetch("/api/account/dashboard", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const dashboardData: DashboardResponse = await dashboardResponse.json();

        if (dashboardResponse.status === 401) {
          router.replace("/login");
          return;
        }

        if (!dashboardResponse.ok) {
          throw new Error(dashboardData?.error || "Unable to load your dashboard.");
        }

        if (dashboardData.user) setUser(dashboardData.user);
        setStats(dashboardData.stats || emptyStats);
        setOrders(Array.isArray(dashboardData.orders) ? dashboardData.orders : []);
        setDownloads(Array.isArray(dashboardData.downloads) ? dashboardData.downloads : []);
      } catch (dashboardError) {
        console.error("ACCOUNT_DASHBOARD_ERROR:", dashboardError);
        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Unable to load your dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setProfileFirstName(user.firstName || "");
    setProfileLastName(user.lastName || "");
  }, [user]);

  async function handleProfileSave() {
    try {
      setProfileSaving(true);
      setProfileSuccess("");
      setProfileError("");

      const firstName = profileFirstName.trim();
      const lastName = profileLastName.trim();

      if (!firstName) {
        setProfileError("First name is required.");
        return;
      }
      if (!lastName) {
        setProfileError("Last name is required.");
        return;
      }

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update your profile.");
      }

      if (data?.user) {
        setUser((currentUser) => ({ ...(currentUser || {}), ...data.user }));
      } else {
        setUser((currentUser) =>
          currentUser ? { ...currentUser, firstName, lastName } : currentUser
        );
      }

      setProfileFirstName(firstName);
      setProfileLastName(lastName);
      setProfileSuccess(data?.message || "Profile updated successfully.");
      router.refresh();
    } catch (profileUpdateError) {
      console.error("PROFILE_UPDATE_ERROR:", profileUpdateError);
      setProfileError(
        profileUpdateError instanceof Error
          ? profileUpdateError.message
          : "Unable to update your profile."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave() {
    try {
      setPasswordSaving(true);
      setPasswordSuccess("");
      setPasswordError("");

      if (!newPassword) {
        setPasswordError("New password is required.");
        return;
      }
      if (newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("New password and confirm password do not match.");
        return;
      }

      const response = await fetch("/api/account/password", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update your password.");
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(data?.message || "Password updated successfully.");
    } catch (passwordUpdateError) {
      console.error("PASSWORD_UPDATE_ERROR:", passwordUpdateError);
      setPasswordError(
        passwordUpdateError instanceof Error
          ? passwordUpdateError.message
          : "Unable to update your password."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
      router.refresh();
    } catch (logoutError) {
      console.error("LOGOUT_ERROR:", logoutError);
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = useMemo(() => {
    if (!user) return "Zonix Customer";
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Zonix Customer";
  }, [user]);

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length === 0) return "Z";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "Z";
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
  }, [displayName]);

  if (loading) {
    return (
      <section className="min-h-[72vh] bg-[#f3f6fb] px-5 py-16 sm:px-6">
        <div className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center rounded-[34px] border border-slate-200 bg-white shadow-[0_22px_80px_rgba(15,23,42,0.08)]">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#ff6500]" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading your account...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!user) return null;

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="bg-[#f3f6fb] text-[#081226]">
      <section className="relative overflow-hidden bg-[#071222] text-white">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#ff6500]/20 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_390px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb071]">
                <span className="h-2 w-2 rounded-full bg-[#ff6500]" />
                My Account
              </div>

              <h1 className="mt-5 max-w-4xl text-[2.35rem] font-black leading-[0.98] tracking-[-0.04em] sm:mt-6 sm:text-5xl lg:text-7xl">
                Welcome back{user.firstName ? `, ${user.firstName}` : ""}.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:mt-5 sm:text-lg sm:leading-8">
                Your purchases, downloads and account details — all in one clean place.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7 sm:flex sm:flex-wrap sm:gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("Downloads")}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#ff6500] px-4 py-3 text-center text-sm font-extrabold !text-white shadow-[0_12px_32px_rgba(255,101,0,.26)] transition hover:-translate-y-0.5 hover:bg-[#f35f00] sm:px-5"
                >
                  View Downloads
                </button>
                <Link
                  href="/products"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-extrabold !text-white transition hover:bg-white/10 sm:px-5"
                >
                  Browse Store
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:rounded-[28px] sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#071222] shadow-lg">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold">{displayName}</p>
                  <p className="mt-1 truncate text-sm text-white/50">{user.email}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Account</p>
                  <p className="mt-2 text-sm font-bold text-white">{user.role || "CUSTOMER"}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Status</p>
                  <p className="mt-2 text-sm font-bold text-emerald-300">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard label="Total purchases" value={String(stats.totalPurchases)} note="Paid orders" tone="orange" />
          <StatCard label="Available downloads" value={String(stats.availableDownloads)} note="Ready to access" tone="cyan" />
          <StatCard label="Lifetime spent" value={formatMoney(stats.lifetimeSpent)} note="Across paid purchases" tone="navy" />
        </div>

        <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="h-fit overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2.5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-3 lg:sticky lg:top-28">
            <div className="rounded-[20px] bg-[#071222] p-4 text-white sm:rounded-[22px] sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff9b57]">Account Center</p>
              <p className="mt-2 truncate font-extrabold">{displayName}</p>
              <p className="mt-1 truncate text-xs text-white/45">{user.email}</p>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2 lg:mt-3 lg:block">
              {tabs.map((item) => {
                const selected = activeTab === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActiveTab(item)}
                    className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-2.5 py-2.5 text-center text-[11px] font-bold transition sm:rounded-2xl sm:px-3 sm:py-3 sm:text-xs lg:mb-1 lg:w-full lg:justify-start lg:gap-3 lg:px-4 lg:text-left lg:text-sm ${
                      selected
                        ? "bg-[#ff6500] text-white shadow-[0_8px_22px_rgba(255,101,0,.22)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#081226]"
                    }`}
                  >
                    <TabIcon name={item} />
                    {item}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2.5 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-3 sm:rounded-2xl lg:text-left"
            >
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </aside>

          <div className="min-w-0 space-y-6">
            {activeTab === "Overview" && (
              <>
                <DashboardPanel
                  eyebrow="Purchases"
                  title="Recent orders"
                  description="A quick look at your latest store activity."
                  actionLabel="View all"
                  onAction={() => setActiveTab("Orders")}
                >
                  {recentOrders.length === 0 ? (
                    <EmptyState
                      title="No orders yet"
                      description="Your purchases will appear here after checkout."
                      actionHref="/products"
                      actionLabel="Browse Products"
                    />
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                </DashboardPanel>

                <DashboardPanel
                  eyebrow="Digital Library"
                  title="Your downloads"
                  description="Access files from eligible paid purchases."
                  actionLabel="View all"
                  onAction={() => setActiveTab("Downloads")}
                >
                  <DownloadGrid downloads={downloads.slice(0, 2)} />
                </DashboardPanel>
              </>
            )}

            {activeTab === "Orders" && (
              <DashboardPanel
                eyebrow="Purchase history"
                title="All orders"
                description="Review your complete order history and open individual order details."
              >
                {orders.length === 0 ? (
                  <EmptyState
                    title="No orders found"
                    description="When you purchase an asset, it will appear here."
                    actionHref="/products"
                    actionLabel="Browse Products"
                  />
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </DashboardPanel>
            )}

            {activeTab === "Downloads" && (
              <DashboardPanel
                eyebrow="Digital library"
                title="Available downloads"
                description="Download your eligible products and keep an eye on access limits."
              >
                <DownloadGrid downloads={downloads} />
              </DashboardPanel>
            )}

            {activeTab === "Profile" && (
              <DashboardPanel
                eyebrow="Personal information"
                title="Profile settings"
                description="Update your name and review your account information."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FieldBlock label="First name">
                    <input
                      id="profile-first-name"
                      type="text"
                      value={profileFirstName}
                      onChange={(event) => {
                        setProfileFirstName(event.target.value);
                        setProfileSuccess("");
                        setProfileError("");
                      }}
                      disabled={profileSaving}
                      maxLength={80}
                      autoComplete="given-name"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#081226] outline-none transition placeholder:text-slate-400 focus:border-[#ff6500] focus:bg-white focus:ring-4 focus:ring-[#ff6500]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter first name"
                    />
                  </FieldBlock>

                  <FieldBlock label="Last name">
                    <input
                      id="profile-last-name"
                      type="text"
                      value={profileLastName}
                      onChange={(event) => {
                        setProfileLastName(event.target.value);
                        setProfileSuccess("");
                        setProfileError("");
                      }}
                      disabled={profileSaving}
                      maxLength={80}
                      autoComplete="family-name"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#081226] outline-none transition placeholder:text-slate-400 focus:border-[#ff6500] focus:bg-white focus:ring-4 focus:ring-[#ff6500]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter last name"
                    />
                  </FieldBlock>

                  <ProfileField label="Email address" value={user.email || "Not available"} />
                  <ProfileField label="Account role" value={user.role || "CUSTOMER"} accent />
                  <div className="md:col-span-2">
                    <ProfileField label="User ID" value={user.id} />
                  </div>
                </div>

                {profileError && <Alert tone="error">{profileError}</Alert>}
                {profileSuccess && <Alert tone="success">{profileSuccess}</Alert>}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="rounded-2xl bg-[#ff6500] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#f35f00] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {profileSaving ? "Saving changes..." : "Save changes"}
                  </button>
                  <p className="text-xs leading-5 text-slate-400">
                    Email address, role and user ID cannot be changed here.
                  </p>
                </div>
              </DashboardPanel>
            )}

            {activeTab === "Security" && (
              <DashboardPanel
                eyebrow="Account security"
                title="Security settings"
                description="Change your password or sign out of your current session."
              >
                <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                    <h3 className="text-lg font-extrabold text-[#081226]">Change password</h3>
                    <p className="mt-1 text-sm text-slate-500">Use at least 8 characters.</p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <FieldBlock label="New password">
                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(event.target.value);
                            setPasswordSuccess("");
                            setPasswordError("");
                          }}
                          disabled={passwordSaving}
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          placeholder="Enter new password"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-[#081226] outline-none transition placeholder:text-slate-400 focus:border-[#ff6500] focus:ring-4 focus:ring-[#ff6500]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </FieldBlock>

                      <FieldBlock label="Confirm password">
                        <input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            setPasswordSuccess("");
                            setPasswordError("");
                          }}
                          disabled={passwordSaving}
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          placeholder="Re-enter new password"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-[#081226] outline-none transition placeholder:text-slate-400 focus:border-[#ff6500] focus:ring-4 focus:ring-[#ff6500]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </FieldBlock>
                    </div>

                    {passwordError && <Alert tone="error">{passwordError}</Alert>}
                    {passwordSuccess && <Alert tone="success">{passwordSuccess}</Alert>}

                    <button
                      type="button"
                      onClick={handlePasswordSave}
                      disabled={passwordSaving}
                      className="mt-5 rounded-2xl bg-[#ff6500] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#f35f00] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {passwordSaving ? "Updating password..." : "Update password"}
                    </button>
                  </div>

                  <div className="rounded-[24px] bg-[#071222] p-5 text-white sm:p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <TabIcon name="Security" />
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold">Active session</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      You are currently signed in to Zonix Assets.
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="mt-6 w-full rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-3.5 text-sm font-bold text-red-200 transition hover:bg-red-400/15 disabled:opacity-50"
                    >
                      {loggingOut ? "Signing out..." : "Sign out this session"}
                    </button>
                  </div>
                </div>
              </DashboardPanel>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "orange" | "cyan" | "navy";
}) {
  const toneClasses = {
    orange: "bg-[#fff3ea] text-[#ff6500]",
    cyan: "bg-[#e8fbfd] text-[#0798a9]",
    navy: "bg-[#eef2f7] text-[#081226]",
  }[tone];

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#081226] sm:mt-3 sm:text-4xl">{value}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">{note}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black ${toneClasses}`}>✦</div>
      </div>
    </div>
  );
}

function DashboardPanel({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.055)] sm:rounded-[30px]">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff6500]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-[#081226] sm:text-2xl">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="w-fit text-sm font-extrabold text-[#ff6500] transition hover:text-[#d95500]"
          >
            {actionLabel} →
          </button>
        )}
      </div>
      <div className="p-4 sm:p-7">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center sm:rounded-[24px] sm:px-5 sm:py-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0e6] text-lg text-[#ff6500]">✦</div>
      <p className="mt-4 font-extrabold text-[#081226]">{title}</p>
      <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-slate-500">{description}</p>
      <Link href={actionHref} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#ff6500] px-5 py-3 text-sm font-extrabold !text-white shadow-[0_10px_26px_rgba(255,101,0,.18)] transition hover:bg-[#f35f00]">
        {actionLabel}
      </Link>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const productNames = order.items?.map((item) => item.productTitle).filter(Boolean).join(", ") || "Digital Purchase";
  const totalItems = order.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white sm:p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-slate-400">{order.orderNumber || order.id}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getStatusClasses(order.status)}`}>
              {order.status}
            </span>
          </div>
          <h3 className="mt-3 line-clamp-2 font-extrabold text-[#081226]">{productNames}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>{formatDate(order.createdAt)}</span>
            <span>{totalItems} item(s)</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:text-right">
            <p className="text-lg font-black text-[#081226]">{formatMoney(order.total)}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">Order total</p>
          </div>
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#081226] transition hover:border-[#ff6500]/30 hover:text-[#ff6500]"
          >
            View Order
          </Link>
        </div>
      </div>
    </div>
  );
}

function DownloadGrid({ downloads }: { downloads: DownloadItem[] }) {
  if (downloads.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center sm:rounded-[24px] sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8fbfd] text-xl text-[#0798a9]">✦</div>
        <p className="mt-4 font-extrabold text-[#081226]">No downloads available yet</p>
        <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-slate-500">
          Digital downloads become available after a successful paid purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {downloads.map((product) => {
        const usedDownloads = Number(product.downloadCount || 0);
        const maxDownloads = Number(product.maxDownloads || 10);
        const remainingDownloads = Math.max(maxDownloads - usedDownloads, 0);
        const isExpired = product.expiresAt ? new Date(product.expiresAt).getTime() < Date.now() : false;
        const canDownload = remainingDownloads > 0 && !isExpired;
        const progress = Math.min((usedDownloads / Math.max(maxDownloads, 1)) * 100, 100);

        return (
          <article key={product.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
            <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(15,157,173,.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,101,0,.24),transparent_30%),#071222]">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:34px_34px]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl font-black text-white backdrop-blur-sm">Z</div>
            </div>

            <div className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6500]">{product.type || "Digital Product"}</p>
              <h3 className="mt-2 text-lg font-black leading-snug text-[#081226]">{product.title}</h3>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="font-semibold text-slate-500">Downloads used</span>
                  <span className="font-bold text-[#081226]">{usedDownloads}/{maxDownloads}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#ff6500] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400">Remaining</span>
                  <span className="font-bold text-[#0798a9]">{remainingDownloads}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400">Expires</span>
                  <span className={isExpired ? "font-semibold text-red-600" : "font-semibold text-slate-600"}>
                    {formatExpiryDate(product.expiresAt)}
                  </span>
                </div>
              </div>

              {isExpired && <Alert tone="error">This download access has expired.</Alert>}
              {!isExpired && remainingDownloads === 0 && <Alert tone="warning">Download limit reached.</Alert>}

              {canDownload ? (
                <a
                  href={`/api/downloads/${product.id}`}
                  className="mt-5 block w-full rounded-2xl bg-[#ff6500] py-3 text-center text-sm font-extrabold text-white transition hover:bg-[#f35f00]"
                >
                  Download Files
                </a>
              ) : (
                <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-400">
                  Download Unavailable
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function ProfileField({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div className={`truncate rounded-2xl border px-4 py-3.5 text-sm font-semibold ${accent ? "border-[#bdecef] bg-[#effcfd] text-[#078797]" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
        {value}
      </div>
    </div>
  );
}

function Alert({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const classes = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium ${classes}`}>{children}</div>;
}
