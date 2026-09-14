"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CustomerOrderItem = {
  id: string;
  productId: string | null;
  title: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  paymentProvider: string | null;
  paymentReference: string | null;
  createdAt: string | null;
  itemCount: number;
  items: CustomerOrderItem[];
};

type CustomerStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type CustomerDetails = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string | null;
  stats: CustomerStats;
  orders: CustomerOrder[];
};

type ApiResponse = {
  success: boolean;
  customer: CustomerDetails;
  error?: string;
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string) {
  const value =
    String(status || "").toUpperCase();

  if (value === "PAID") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (value === "PENDING") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
  }

  if (
    value === "CANCELLED" ||
    value === "CANCELED"
  ) {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

function getRoleClasses(role: string) {
  if (
    String(role || "").toUpperCase() ===
    "ADMIN"
  ) {
    return "border-purple-400/20 bg-purple-400/10 text-purple-300";
  }

  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
}

export default function AdminCustomerDetails() {
  const router = useRouter();
  const params = useParams();

  const customerId =
    typeof params?.id === "string"
      ? params.id
      : "";

  const [customer, setCustomer] =
    useState<CustomerDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [updatingRole, setUpdatingRole] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  async function loadCustomer() {
    if (!customerId) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(
          customerId
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load customer."
        );
      }

      setCustomer(data.customer);
    } catch (loadError) {
      console.error(
        "ADMIN_CUSTOMER_DETAILS_UI_ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load customer."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(
    role: "ADMIN" | "CUSTOMER"
  ) {
    if (!customer) {
      return;
    }

    const currentRole =
      String(
        customer.role || ""
      ).toUpperCase();

    if (currentRole === role) {
      setSuccessMessage(
        `Account is already ${role}.`
      );
      return;
    }

    const confirmed = window.confirm(
      role === "ADMIN"
        ? `Make ${customer.name} an ADMIN?`
        : `Change ${customer.name} to CUSTOMER?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingRole(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(
          customer.id
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            role,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/account");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update account role."
        );
      }

      setSuccessMessage(
        data?.message ||
          `Account role updated to ${role}.`
      );

      await loadCustomer();
    } catch (updateError) {
      console.error(
        "ADMIN_CUSTOMER_ROLE_UI_ERROR:",
        updateError
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update account role."
      );
    } finally {
      setUpdatingRole(false);
    }
  }

  async function updateActiveStatus(
    isActive: boolean
  ) {
    if (!customer) {
      return;
    }

    if (customer.isActive === isActive) {
      setSuccessMessage(
        isActive
          ? "Account is already active."
          : "Account is already suspended."
      );
      return;
    }

    const confirmed = window.confirm(
      isActive
        ? `Activate ${customer.name}'s account?`
        : `Suspend ${customer.name}'s account? They will lose access until the account is activated again.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(
          customer.id
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            isActive,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data?.error ||
            "You do not have permission to change this account status."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update account status."
        );
      }

      setSuccessMessage(
        data?.message ||
          (isActive
            ? "Account activated successfully."
            : "Account suspended successfully.")
      );

      await loadCustomer();
    } catch (updateError) {
      console.error(
        "ADMIN_CUSTOMER_STATUS_UI_ERROR:",
        updateError
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update account status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-white/40">
            Loading customer details...
          </p>
        </div>
      </main>
    );
  }

  if (error && !customer) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>

          <Link
            href="/admin/customers"
            className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10"
          >
            Back to Customers
          </Link>
        </div>
      </main>
    );
  }

  if (!customer) {
    return null;
  }

  const role =
    String(
      customer.role || ""
    ).toUpperCase();

  const isActive =
    customer.isActive !== false;

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
              Customer Details
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/customers"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Customers
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Orders
            </Link>

            <Link
              href="/products"
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
            >
              View Store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="text-sm text-white/35">
          <Link
            href="/admin"
            className="hover:text-white"
          >
            Admin
          </Link>

          <span className="mx-2">
            /
          </span>

          <Link
            href="/admin/customers"
            className="hover:text-white"
          >
            Customers
          </Link>

          <span className="mx-2">
            /
          </span>

          <span>
            {customer.name}
          </span>
        </div>

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-emerald-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm text-emerald-400">
                Customer Account
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold md:text-5xl">
                  {customer.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRoleClasses(
                    customer.role
                  )}`}
                >
                  {customer.role}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-red-400/20 bg-red-400/10 text-red-300"
                  }`}
                >
                  {isActive ? "ACTIVE" : "SUSPENDED"}
                </span>
              </div>

              <p className="mt-4 text-white/45">
                {customer.email ||
                  "No email address"}
              </p>

              <p className="mt-2 break-all text-sm text-white/25">
                ID: {customer.id}
              </p>

              <p className="mt-2 text-sm text-white/30">
                Joined{" "}
                {formatDate(
                  customer.createdAt
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={loadCustomer}
              disabled={loading}
              className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh Customer
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Orders"
            value={String(
              customer.stats.totalOrders
            )}
          />

          <StatCard
            label="Paid Orders"
            value={String(
              customer.stats.paidOrders
            )}
            accent
          />

          <StatCard
            label="Pending Orders"
            value={String(
              customer.stats.pendingOrders
            )}
          />

          <StatCard
            label="Cancelled"
            value={String(
              customer.stats.cancelledOrders
            )}
          />

          <StatCard
            label="Total Spent"
            value={formatMoney(
              customer.stats.totalSpent
            )}
            accent
          />
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-sm text-emerald-400">
            Account
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Account Information
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard
              label="First Name"
              value={
                customer.firstName ||
                "—"
              }
            />

            <InfoCard
              label="Last Name"
              value={
                customer.lastName ||
                "—"
              }
            />

            <InfoCard
              label="Email Address"
              value={
                customer.email ||
                "—"
              }
            />

            <InfoCard
              label="Account Role"
              value={customer.role}
            />

            <InfoCard
              label="Account Status"
              value={isActive ? "ACTIVE" : "SUSPENDED"}
            />

            <InfoCard
              label="Last Order"
              value={formatDate(
                customer.stats.lastOrderAt
              )}
            />

            <InfoCard
              label="Customer ID"
              value={customer.id}
            />
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-sm text-emerald-400">
            Permissions
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Account Role Management
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Change this account between CUSTOMER and ADMIN.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                updateRole("ADMIN")
              }
              disabled={
                updatingRole ||
                updatingStatus ||
                role === "ADMIN"
              }
              className="rounded-xl bg-purple-400 px-5 py-3 font-semibold text-black transition hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updatingRole
                ? "Updating..."
                : role === "ADMIN"
                ? "Already Admin"
                : "Make Admin"}
            </button>

            <button
              type="button"
              onClick={() =>
                updateRole("CUSTOMER")
              }
              disabled={
                updatingRole ||
                updatingStatus ||
                role === "CUSTOMER"
              }
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updatingRole
                ? "Updating..."
                : role === "CUSTOMER"
                ? "Already Customer"
                : "Make Customer"}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-200">
            Your backend protects the currently logged-in admin from removing their own ADMIN role.
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-sm text-emerald-400">
            Access
          </p>

          <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Account Access Management
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-white/40">
                Suspend an account to block access, or activate it again when access should be restored.
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                isActive
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-red-400/20 bg-red-400/10 text-red-300"
              }`}
            >
              {isActive ? "ACTIVE" : "SUSPENDED"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {isActive ? (
              <button
                type="button"
                onClick={() =>
                  updateActiveStatus(false)
                }
                disabled={
                  updatingStatus ||
                  updatingRole
                }
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {updatingStatus
                  ? "Suspending..."
                  : "Suspend Account"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  updateActiveStatus(true)
                }
                disabled={
                  updatingStatus ||
                  updatingRole
                }
                className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {updatingStatus
                  ? "Activating..."
                  : "Activate Account"}
              </button>
            )}

            <button
              type="button"
              onClick={loadCustomer}
              disabled={
                loading ||
                updatingStatus ||
                updatingRole
              }
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Refresh Status
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-200">
            Your backend should prevent the currently logged-in admin from suspending their own account.
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-6 md:p-8">
            <p className="text-sm text-emerald-400">
              Purchases
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Customer Orders
            </h2>

            <p className="mt-2 text-sm text-white/35">
              {customer.orders.length}{" "}
              order
              {customer.orders.length === 1
                ? ""
                : "s"}{" "}
              found.
            </p>
          </div>

          {customer.orders.length === 0 ? (
            <div className="p-10 text-center text-white/40">
              This customer has no orders yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {customer.orders.map(
                (order) => (
                  <article
                    key={order.id}
                    className="p-6 md:p-8"
                  >
                    <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold">
                            {order.orderNumber}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-white/35">
                          Created{" "}
                          {formatDate(
                            order.createdAt
                          )}
                        </p>

                        <p className="mt-2 text-sm text-white/35">
                          {order.itemCount}{" "}
                          item
                          {order.itemCount === 1
                            ? ""
                            : "s"}
                        </p>
                      </div>

                      <div className="text-left xl:text-right">
                        <p className="text-sm text-white/35">
                          Order Total
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {formatMoney(
                            order.total
                          )}
                        </p>

                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10"
                        >
                          View Order
                        </Link>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                      <InfoCard
                        label="Subtotal"
                        value={formatMoney(
                          order.subtotal
                        )}
                      />

                      <InfoCard
                        label="Payment Provider"
                        value={
                          order.paymentProvider ||
                          "—"
                        }
                      />

                      <InfoCard
                        label="Payment Reference"
                        value={
                          order.paymentReference ||
                          "—"
                        }
                      />
                    </div>

                    {order.items.length > 0 && (
                      <div className="mt-6">
                        <p className="mb-3 text-sm text-white/40">
                          Purchased Products
                        </p>

                        <div className="space-y-3">
                          {order.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-semibold">
                                    {item.title}
                                  </p>

                                  <p className="mt-1 text-xs text-white/35">
                                    Qty:{" "}
                                    {item.quantity}{" "}
                                    · Unit:{" "}
                                    {formatMoney(
                                      item.price
                                    )}
                                  </p>
                                </div>

                                <p className="font-semibold">
                                  {formatMoney(
                                    item.lineTotal
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-sm text-emerald-400">
            Admin
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Quick Actions
          </h2>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/customers"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10"
            >
              Back to Customers
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10"
            >
              View All Orders
            </Link>

            <Link
              href="/admin"
              className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black hover:bg-emerald-300"
            >
              Admin Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-white/40">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          accent
            ? "text-emerald-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-5">
      <p className="text-sm text-white/35">
        {label}
      </p>

      <p className="mt-2 break-all font-semibold">
        {value}
      </p>
    </div>
  );
}