"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  // Existing field, kept for compatibility
  downloadUrl?: string | null;

  // Secure download information
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

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatExpiryDate(value?: string | null) {
  if (!value) {
    return "No expiry";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusClasses(status: string) {
  const normalizedStatus =
    status?.toUpperCase();

  if (normalizedStatus === "PAID") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalizedStatus === "PENDING") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (normalizedStatus === "CANCELLED") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (normalizedStatus === "REFUNDED") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

export default function AccountDashboard() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [stats, setStats] =
    useState<DashboardStats>(emptyStats);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [downloads, setDownloads] =
    useState<DownloadItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("Overview");

  const [profileFirstName, setProfileFirstName] =
    useState("");
  const [profileLastName, setProfileLastName] =
    useState("");
  const [profileSaving, setProfileSaving] =
    useState(false);
  const [profileSuccess, setProfileSuccess] =
    useState("");
  const [profileError, setProfileError] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [passwordSaving, setPasswordSaving] =
    useState(false);
  const [passwordSuccess, setPasswordSuccess] =
    useState("");
  const [passwordError, setPasswordError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        /*
          1. Verify current login session
        */

        const sessionResponse =
          await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });

        const sessionData =
          await sessionResponse.json();

        if (
          sessionResponse.status === 403 &&
          sessionData?.code === "ACCOUNT_SUSPENDED"
        ) {
          router.replace("/login");
          router.refresh();
          return;
        }

        if (
          !sessionResponse.ok ||
          !sessionData?.authenticated ||
          !sessionData?.user
        ) {
          router.replace("/login");
          router.refresh();
          return;
        }

        setUser(sessionData.user);

        /*
          2. Load dashboard data
        */

        const dashboardResponse =
          await fetch(
            "/api/account/dashboard",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const dashboardData: DashboardResponse =
          await dashboardResponse.json();

        if (
          dashboardResponse.status === 401
        ) {
          router.replace("/login");
          return;
        }

        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardData?.error ||
              "Unable to load your dashboard."
          );
        }

        if (dashboardData.user) {
          setUser(dashboardData.user);
        }

        setStats(
          dashboardData.stats ||
            emptyStats
        );

        setOrders(
          Array.isArray(
            dashboardData.orders
          )
            ? dashboardData.orders
            : []
        );

        setDownloads(
          Array.isArray(
            dashboardData.downloads
          )
            ? dashboardData.downloads
            : []
        );
      } catch (dashboardError) {
        console.error(
          "ACCOUNT_DASHBOARD_ERROR:",
          dashboardError
        );

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

      const response = await fetch(
        "/api/account/profile",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
          }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update your profile."
        );
      }

      if (data?.user) {
        setUser((currentUser) => ({
          ...(currentUser || {}),
          ...data.user,
        }));
      } else {
        setUser((currentUser) =>
          currentUser
            ? {
                ...currentUser,
                firstName,
                lastName,
              }
            : currentUser
        );
      }

      setProfileFirstName(firstName);
      setProfileLastName(lastName);
      setProfileSuccess(
        data?.message ||
          "Profile updated successfully."
      );

      router.refresh();
    } catch (profileUpdateError) {
      console.error(
        "PROFILE_UPDATE_ERROR:",
        profileUpdateError
      );

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
        setPasswordError(
          "New password is required."
        );
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError(
          "Password must be at least 8 characters long."
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError(
          "New password and confirm password do not match."
        );
        return;
      }

      const response = await fetch(
        "/api/account/password",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update your password."
        );
      }

      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(
        data?.message ||
          "Password updated successfully."
      );
    } catch (passwordUpdateError) {
      console.error(
        "PASSWORD_UPDATE_ERROR:",
        passwordUpdateError
      );

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

      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      router.push("/login");
      router.refresh();
    } catch (logoutError) {
      console.error(
        "LOGOUT_ERROR:",
        logoutError
      );
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />

          <p className="mt-4 text-sm text-white/40">
            Loading your account...
          </p>
        </div>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ") ||
    "PakStore Customer";

  const recentOrders =
    orders.slice(0, 3);

  return (
    <>
      {/* Header */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-medium text-emerald-400">
            Customer Dashboard
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold md:text-5xl">
                Welcome Back
                {user.firstName
                  ? `, ${user.firstName}`
                  : ""}
              </h1>

              <p className="mt-3 text-white/40">
                Manage your purchases,
                downloads and account.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  {user.role ||
                    "CUSTOMER"}
                </span>

                {user.email && (
                  <span className="text-sm text-white/35">
                    {user.email}
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/products"
              className="w-fit rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        {error && (
          <div className="mb-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/40">
              Total Purchases
            </p>

            <p className="mt-3 text-4xl font-bold">
              {stats.totalPurchases}
            </p>

            <p className="mt-2 text-xs text-white/25">
              Paid orders
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/40">
              Available Downloads
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-400">
              {
                stats.availableDownloads
              }
            </p>

            <p className="mt-2 text-xs text-white/25">
              Ready to download
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/40">
              Lifetime Spent
            </p>

            <p className="mt-3 text-4xl font-bold">
              {formatMoney(
                stats.lifetimeSpent
              )}
            </p>

            <p className="mt-2 text-xs text-white/25">
              Across paid purchases
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-4 lg:sticky lg:top-28">
            <div className="mb-5 rounded-2xl border border-white/10 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
                Account
              </p>

              <h3 className="mt-2 font-semibold">
                {displayName}
              </h3>

              <p className="mt-1 truncate text-xs text-white/35">
                {user.email}
              </p>
            </div>

            {[
              "Overview",
              "Orders",
              "Downloads",
              "Profile",
              "Security",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setActiveTab(item)
                }
                className={
                  activeTab === item
                    ? "mb-2 w-full rounded-xl bg-emerald-400 px-4 py-3 text-left text-sm font-semibold text-black"
                    : "mb-2 w-full rounded-xl px-4 py-3 text-left text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
                }
              >
                {item}
              </button>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-4 w-full rounded-xl border border-red-400/20 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut
                ? "Signing Out..."
                : "Sign Out"}
            </button>
          </aside>

          {/* Main content */}
          <div className="space-y-8">
            {/* OVERVIEW */}
            {activeTab ===
              "Overview" && (
              <>
                <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-emerald-400">
                        Purchases
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        Recent Orders
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "Orders"
                        )
                      }
                      className="text-sm text-white/40 transition hover:text-white"
                    >
                      View All
                    </button>
                  </div>

                  {recentOrders.length ===
                  0 ? (
                    <div className="mt-7 rounded-2xl border border-white/10 bg-black p-8 text-center">
                      <p className="font-medium">
                        No orders yet
                      </p>

                      <p className="mt-2 text-sm text-white/40">
                        Your purchases
                        will appear here
                        after checkout.
                      </p>

                      <Link
                        href="/products"
                        className="mt-5 inline-block rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black"
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-7 space-y-4">
                      {recentOrders.map(
                        (order) => (
                          <OrderCard
                            key={
                              order.id
                            }
                            order={
                              order
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-emerald-400">
                        Digital Library
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        Your Downloads
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "Downloads"
                        )
                      }
                      className="text-sm text-white/40 transition hover:text-white"
                    >
                      View All
                    </button>
                  </div>

                  <DownloadGrid
                    downloads={downloads.slice(
                      0,
                      2
                    )}
                  />
                </section>
              </>
            )}

            {/* ORDERS */}
            {activeTab === "Orders" && (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <p className="text-sm text-emerald-400">
                  Purchase History
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  All Orders
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  View your complete
                  purchase history.
                </p>

                {orders.length === 0 ? (
                  <div className="mt-7 rounded-2xl border border-white/10 bg-black p-8 text-center">
                    <p className="text-white/60">
                      No orders found.
                    </p>
                  </div>
                ) : (
                  <div className="mt-7 space-y-4">
                    {orders.map(
                      (order) => (
                        <OrderCard
                          key={
                            order.id
                          }
                          order={order}
                        />
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {/* DOWNLOADS */}
            {activeTab ===
              "Downloads" && (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <p className="text-sm text-emerald-400">
                  Digital Library
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Available Downloads
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Access digital products
                  from completed purchases.
                </p>

                <DownloadGrid
                  downloads={downloads}
                />
              </section>
            )}

            {/* PROFILE */}
            {activeTab ===
              "Profile" && (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <p className="text-sm text-emerald-400">
                  Personal Information
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Profile
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Update your account name and review your account details.
                </p>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profile-first-name"
                      className="text-xs text-white/35"
                    >
                      First Name
                    </label>

                    <input
                      id="profile-first-name"
                      type="text"
                      value={profileFirstName}
                      onChange={(event) => {
                        setProfileFirstName(
                          event.target.value
                        );
                        setProfileSuccess("");
                        setProfileError("");
                      }}
                      disabled={profileSaving}
                      maxLength={80}
                      autoComplete="given-name"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-last-name"
                      className="text-xs text-white/35"
                    >
                      Last Name
                    </label>

                    <input
                      id="profile-last-name"
                      type="text"
                      value={profileLastName}
                      onChange={(event) => {
                        setProfileLastName(
                          event.target.value
                        );
                        setProfileSuccess("");
                        setProfileError("");
                      }}
                      disabled={profileSaving}
                      maxLength={80}
                      autoComplete="family-name"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <ProfileField
                      label="Email Address"
                      value={
                        user.email ||
                        "Not available"
                      }
                    />
                  </div>

                  <ProfileField
                    label="Account Role"
                    value={
                      user.role ||
                      "CUSTOMER"
                    }
                    emerald
                  />

                  <ProfileField
                    label="User ID"
                    value={user.id}
                  />
                </div>

                {profileError && (
                  <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                    {profileSuccess}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {profileSaving
                      ? "Saving Changes..."
                      : "Save Changes"}
                  </button>

                  <p className="text-xs text-white/30">
                    Email address, role and user ID cannot be changed here.
                  </p>
                </div>
              </section>
            )}

            {/* SECURITY */}
            {activeTab ===
              "Security" && (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <p className="text-sm text-emerald-400">
                  Account Security
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Security Settings
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Change your password and manage your active session.
                </p>

                <div className="mt-7 space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-black p-5 md:p-6">
                    <h3 className="font-semibold">
                      Change Password
                    </h3>

                    <p className="mt-1 text-sm text-white/40">
                      Use at least 8 characters for your new password.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="new-password"
                          className="text-xs text-white/35"
                        >
                          New Password
                        </label>

                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(
                              event.target.value
                            );
                            setPasswordSuccess("");
                            setPasswordError("");
                          }}
                          disabled={passwordSaving}
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          placeholder="Enter new password"
                          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="confirm-password"
                          className="text-xs text-white/35"
                        >
                          Confirm Password
                        </label>

                        <input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(
                              event.target.value
                            );
                            setPasswordSuccess("");
                            setPasswordError("");
                          }}
                          disabled={passwordSaving}
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          placeholder="Re-enter new password"
                          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                        {passwordSuccess}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handlePasswordSave}
                      disabled={passwordSaving}
                      className="mt-5 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {passwordSaving
                        ? "Updating Password..."
                        : "Update Password"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black p-5 md:p-6">
                    <h3 className="font-semibold">
                      Active Session
                    </h3>

                    <p className="mt-2 text-sm text-white/40">
                      You are currently signed in to PakStore.
                    </p>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-3 text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                    >
                      {loggingOut
                        ? "Signing Out..."
                        : "Sign Out This Session"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------
   ORDER CARD
------------------------------ */

function OrderCard({
  order,
}: {
  order: Order;
}) {
  const productNames =
    order.items
      ?.map((item) => item.productTitle)
      .filter(Boolean)
      .join(", ") || "Digital Purchase";

  const totalItems =
    order.items?.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    ) || 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-white/30">
              {order.orderNumber || order.id}
            </p>

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase ${getStatusClasses(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          <h3 className="mt-3 truncate font-semibold">
            {productNames}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/40">
            <span>
              {formatDate(order.createdAt)}
            </span>

            <span>
              {totalItems} item(s)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
          <div className="sm:text-right">
            <p className="text-lg font-semibold">
              {formatMoney(order.total)}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Order Total
            </p>
          </div>

          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-400/30 hover:bg-white/10 hover:text-emerald-300"
          >
            View Order
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   DOWNLOAD GRID
------------------------------ */

function DownloadGrid({
  downloads,
}: {
  downloads: DownloadItem[];
}) {
  if (downloads.length === 0) {
    return (
      <div className="mt-7 rounded-2xl border border-white/10 bg-black p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-xl text-emerald-400">
          ✦
        </div>

        <p className="mt-4 font-medium">
          No downloads available yet
        </p>

        <p className="mt-2 text-sm text-white/40">
          Digital downloads will
          become available after a
          successful paid purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7 grid gap-5 md:grid-cols-2">
      {downloads.map(
        (product) => {
          const usedDownloads =
            Number(
              product.downloadCount ||
                0
            );

          const maxDownloads =
            Number(
              product.maxDownloads ||
                10
            );

          const remainingDownloads =
            Math.max(
              maxDownloads -
                usedDownloads,
              0
            );

          const isExpired =
            product.expiresAt
              ? new Date(
                  product.expiresAt
                ).getTime() <
                Date.now()
              : false;

          const canDownload =
            remainingDownloads > 0 &&
            !isExpired;

          return (
            <div
              key={product.id}
              className="rounded-2xl border border-white/10 bg-black p-5"
            >
              <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-black">
                <span className="text-2xl text-emerald-400">
                  ✦
                </span>
              </div>

              <p className="mt-5 text-sm text-emerald-400">
                {product.type ||
                  "Digital Product"}
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                {product.title}
              </h3>

              {/* Download usage */}
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-white/40">
                    Downloads Used
                  </span>

                  <span className="font-medium text-white/70">
                    {usedDownloads}/
                    {maxDownloads}
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${Math.min(
                        (usedDownloads /
                          Math.max(
                            maxDownloads,
                            1
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-xs">
                  <span className="text-white/30">
                    Remaining
                  </span>

                  <span className="text-emerald-400">
                    {
                      remainingDownloads
                    }
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                  <span className="text-white/30">
                    Expires
                  </span>

                  <span
                    className={
                      isExpired
                        ? "text-red-300"
                        : "text-white/50"
                    }
                  >
                    {formatExpiryDate(
                      product.expiresAt
                    )}
                  </span>
                </div>
              </div>

              {isExpired && (
                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
                  This download access
                  has expired.
                </div>
              )}

              {!isExpired &&
                remainingDownloads ===
                  0 && (
                  <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
                    Download limit
                    reached.
                  </div>
                )}

              {canDownload ? (
                <a
                  href={`/api/downloads/${product.id}`}
                  className="mt-5 block w-full rounded-xl bg-emerald-400 py-3 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  Download Files
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-5 w-full cursor-not-allowed rounded-xl bg-white/10 py-3 text-sm font-semibold text-white/30"
                >
                  Download Unavailable
                </button>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}

/* ------------------------------
   PROFILE FIELD
------------------------------ */

function ProfileField({
  label,
  value,
  emerald = false,
}: {
  label: string;
  value: string;
  emerald?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-white/35">
        {label}
      </p>

      <div
        className={`mt-2 truncate rounded-xl border border-white/10 bg-black px-4 py-4 text-sm ${
          emerald
            ? "text-emerald-400"
            : "text-white/70"
        }`}
      >
        {value}
      </div>
    </div>
  );
}