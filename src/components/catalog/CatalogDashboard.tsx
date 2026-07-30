"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { IconBox, IconPlus, IconWarning, type IconProps } from "@/components/icons";
import {
  ApiError,
  catalogApi,
  type CatalogSummary,
  type Category,
  type Product,
  type Shipment,
  type ShipmentDirection,
} from "@/lib/api";

/* ------------------------------ page-specific icons --------------------------- */

function IconArrowDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4v10.5M5.5 10.5 10 15l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowUp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 16V5.5M5.5 9.5 10 5l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------- formatting -------------------------------- */

function formatUsd(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_STYLE: Record<Shipment["status"], string> = {
  PENDING: "border-border-strong bg-surface-2 text-ink-2",
  IN_TRANSIT: "border-accent/30 bg-accent/10 text-accent",
  COMPLETED: "border-success/30 bg-success/10 text-success",
  CANCELED: "border-danger/30 bg-danger/10 text-danger",
};

/* ---------------------------------- layout ----------------------------------- */

function StatRow({ summary }: { summary: CatalogSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Products</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl tabular-nums text-ink">{formatNumber(summary.productCount)}</span>
          <span className="text-sm text-ink-3">across {summary.categoryCount} categories</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Total stock on hand</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl tabular-nums text-ink">{formatNumber(summary.totalStockQty)}</span>
          <span className="text-sm text-ink-3">units</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Low stock</p>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-2xl tabular-nums ${summary.lowStockCount > 0 ? "text-warning" : "text-ink"}`}
          >
            {formatNumber(summary.lowStockCount)}
          </span>
          {summary.lowStockCount > 0 && <IconWarning className="h-4 w-4 text-warning" />}
        </div>
        <p className="text-sm text-ink-2">at or below reorder point</p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">In the pipeline</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <IconArrowDown className="h-4 w-4 text-success" />
            <span className="font-mono text-lg tabular-nums text-ink">{formatNumber(summary.inboundPipelineQty)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconArrowUp className="h-4 w-4 text-accent" />
            <span className="font-mono text-lg tabular-nums text-ink">{formatNumber(summary.outboundPipelineQty)}</span>
          </div>
        </div>
        <p className="text-sm text-ink-2">inbound restock · outbound deliveries</p>
      </div>
    </div>
  );
}

function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          active === null ? "border-accent/50 bg-accent/10 text-accent" : "border-border text-ink-2 hover:text-ink"
        }`}
      >
        All categories
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            active === c.id ? "border-accent/50 bg-accent/10 text-accent" : "border-border text-ink-2 hover:text-ink"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

function ProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-medium text-ink">Products</p>
      </div>
      {products.length === 0 ? (
        <p className="px-5 py-6 text-sm text-ink-3">No products in this category.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                  Product
                </th>
                <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                  Category
                </th>
                <th className="px-5 py-2.5 text-right font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                  Price
                </th>
                <th className="px-5 py-2.5 text-right font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                  In stock
                </th>
                <th className="px-5 py-2.5 text-right font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                  Inbound
                </th>
                <th className="px-5 py-2.5 text-right font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                  Outbound
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                  <td className="px-5 py-2.5">
                    <p className="text-ink">{p.name}</p>
                    <p className="font-mono text-xs text-ink-3">{p.sku}</p>
                  </td>
                  <td className="px-5 py-2.5 text-ink-2">{p.category.name}</td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-ink">{formatUsd(p.priceCents)}</td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.lowStock && <IconWarning className="h-3.5 w-3.5 text-warning" />}
                      <span className={`font-mono tabular-nums ${p.lowStock ? "text-warning" : "text-ink"}`}>
                        {formatNumber(p.stockQty)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-ink-2">
                    {p.inboundPipelineQty > 0 ? `+${formatNumber(p.inboundPipelineQty)}` : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-ink-2">
                    {p.outboundPipelineQty > 0 ? `−${formatNumber(p.outboundPipelineQty)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewShipmentForm({
  products,
  pending,
  error,
  onSubmit,
}: {
  products: Product[];
  pending: boolean;
  error: string | null;
  onSubmit: (input: { productId: string; direction: ShipmentDirection; quantity: number; reference: string }) => void;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [direction, setDirection] = useState<ShipmentDirection>("INBOUND");
  const [quantity, setQuantity] = useState("1");
  const [reference, setReference] = useState("");

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const qty = Number(quantity);
        if (!productId || !Number.isFinite(qty) || qty <= 0) return;
        onSubmit({ productId, direction, quantity: qty, reference: reference.trim() });
      }}
    >
      <p className="text-sm font-medium text-ink">Log a shipment</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as ShipmentDirection)}
          className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        >
          <option value="INBOUND">Inbound restock</option>
          <option value="OUTBOUND">Outbound delivery</option>
        </select>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Supplier / order ref"
          className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending || products.length === 0}
        className="flex w-fit items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <IconPlus className="h-3.5 w-3.5" />
        {pending ? "Logging…" : "Log shipment"}
      </button>
    </form>
  );
}

function ShipmentsPanel({
  shipments,
  transitioningId,
  onAdvance,
  onCancel,
}: {
  shipments: Shipment[];
  transitioningId: string | null;
  onAdvance: (id: string, status: Shipment["status"]) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-medium text-ink">Shipment pipeline</p>
      </div>
      {shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <IconBox className="h-6 w-6 text-ink-3" />
          <p className="text-sm text-ink-3">No shipments logged yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {shipments.map((s) => {
            const isOpen = s.status === "PENDING" || s.status === "IN_TRANSIT";
            const isPending = transitioningId === s.id;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 first:border-0">
                <div className="flex items-center gap-3">
                  {s.direction === "INBOUND" ? (
                    <IconArrowDown className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <IconArrowUp className="h-4 w-4 shrink-0 text-accent" />
                  )}
                  <div>
                    <p className="text-sm text-ink">
                      {s.direction === "INBOUND" ? "Restock" : "Delivery"} · {s.product.name}
                    </p>
                    <p className="font-mono text-xs text-ink-3">
                      {formatNumber(s.quantity)} units{s.reference ? ` · ${s.reference}` : ""}
                      {s.expectedAt ? ` · expected ${formatDate(s.expectedAt)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}>
                    {s.status.replace("_", " ").toLowerCase()}
                  </span>
                  {isOpen && (
                    <div className="flex items-center gap-1.5">
                      {s.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onAdvance(s.id, "IN_TRANSIT")}
                          className="rounded-md border border-border px-2 py-1 text-xs text-ink-2 hover:border-border-strong hover:text-ink disabled:opacity-50"
                        >
                          Mark in transit
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onAdvance(s.id, "COMPLETED")}
                        className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs font-medium text-success hover:bg-success/15 disabled:opacity-50"
                      >
                        {s.direction === "INBOUND" ? "Mark received" : "Mark delivered"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onCancel(s.id)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-ink-2 hover:border-danger/40 hover:text-danger disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------- page root --------------------------------- */

export default function CatalogDashboard() {
  const [pageLoading, setPageLoading] = useState(true);
  const [summary, setSummary] = useState<CatalogSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [summaryData, categoriesData, productsData, shipmentsData] = await Promise.all([
          catalogApi.summary(),
          catalogApi.listCategories(),
          catalogApi.listProducts(),
          catalogApi.listShipments(),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setCategories(categoriesData);
        setProducts(productsData);
        setShipments(shipmentsData);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(
    () => (activeCategory ? products.filter((p) => p.category.id === activeCategory) : products),
    [products, activeCategory]
  );

  async function refreshAfterMutation() {
    const [summaryData, productsData, shipmentsData] = await Promise.all([
      catalogApi.summary(),
      catalogApi.listProducts(),
      catalogApi.listShipments(),
    ]);
    setSummary(summaryData);
    setProducts(productsData);
    setShipments(shipmentsData);
  }

  async function handleCreateShipment(input: {
    productId: string;
    direction: ShipmentDirection;
    quantity: number;
    reference: string;
  }) {
    setFormPending(true);
    setFormError(null);
    try {
      await catalogApi.createShipment({
        productId: input.productId,
        direction: input.direction,
        quantity: input.quantity,
        reference: input.reference || undefined,
      });
      await refreshAfterMutation();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't log that shipment. Please try again.");
    } finally {
      setFormPending(false);
    }
  }

  async function handleAdvance(id: string, status: Shipment["status"]) {
    if (status === "PENDING") return;
    setTransitioningId(id);
    try {
      await catalogApi.updateShipmentStatus(id, status);
      await refreshAfterMutation();
    } finally {
      setTransitioningId(null);
    }
  }

  if (pageLoading || !summary) {
    return (
      <AppShell active="catalog" title="Catalog">
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="catalog" title="Catalog">
      <StatRow summary={summary} />

      <div className="flex flex-col gap-4">
        <CategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />
        <ProductsTable products={filteredProducts} />
      </div>

      <NewShipmentForm
        products={products}
        pending={formPending}
        error={formError}
        onSubmit={(input) => void handleCreateShipment(input)}
      />

      <ShipmentsPanel
        shipments={shipments}
        transitioningId={transitioningId}
        onAdvance={(id, status) => void handleAdvance(id, status)}
        onCancel={(id) => void handleAdvance(id, "CANCELED")}
      />
    </AppShell>
  );
}
