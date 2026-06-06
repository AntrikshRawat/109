import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore, selectNetRevenue } from "../store/useAppStore";
import type { PaymentRecord } from "../store/useAppStore";

/* ── Helpers ─────────────────────────────────────────────────────────── */
const formatCurrency = (n: number) =>
  "₹" +
  Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const getCurrentMonthStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const parseMonthStr = (s: string) => {
  const [y, m] = s.split("-").map(Number);
  return new Date(y, m - 1, 1);
};

const getMonthShort = (s: string) =>
  parseMonthStr(s).toLocaleDateString("en-IN", { month: "short" });

const getMonthFull = (s: string) =>
  parseMonthStr(s).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const getYear = (s: string) => parseMonthStr(s).getFullYear();

function PaymentsPage() {
  const { payments, paymentRecords, addPaymentRecord, deletePaymentRecord } =
    useAppStore();
  const navigate = useNavigate();

  const currentMonth = getCurrentMonthStr();

  /* ── Build sorted unique months from payment records ────────────── */
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonth);
    paymentRecords?.forEach((r) => {
      const d = new Date(r.createdAt);
      months.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    });
    return Array.from(months).sort((a, b) => a.localeCompare(b));
  }, [paymentRecords, currentMonth]);

  /* ── Selected month state ──────────────────────────────────────── */
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const isViewingCurrent = selectedMonth === currentMonth;

  /* ── Scroll selected month chip to center ──────────────────────── */
  const stripRef = useRef<HTMLDivElement>(null);
  const scrollToCenter = (month: string, smooth = true) => {
    const container = stripRef.current;
    if (!container) return;
    const chip = container.querySelector(
      `[data-month="${month}"]`
    ) as HTMLElement | null;
    if (!chip) return;
    const scrollLeft =
      chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
    container.scrollTo({
      left: scrollLeft,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    // Scroll to the far right first (current month is last), then center it
    if (stripRef.current) {
      stripRef.current.scrollLeft = stripRef.current.scrollWidth;
    }
  }, []);

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    requestAnimationFrame(() => scrollToCenter(month));
  };

  /* ── Derived monthly stats ─────────────────────────────────────── */
  const { monthRecords, monthIncome, monthExpense, monthNet } = useMemo(() => {
    const records = (paymentRecords || []).filter((r) => {
      const d = new Date(r.createdAt);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return mStr === selectedMonth;
    });

    let inc = 0;
    let exp = 0;
    records.forEach((r) => {
      if (r.type === "income") inc += r.amount;
      else exp += r.amount;
    });

    return {
      monthRecords: records,
      monthIncome: inc,
      monthExpense: exp,
      monthNet: inc - exp,
    };
  }, [paymentRecords, selectedMonth]);

  /* ── Form state ────────────────────────────────────────────────── */
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [formAmount, setFormAmount] = useState("");
  const [formRemark, setFormRemark] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const confirmDeleteRecordData = paymentRecords?.find(
    (r) => r.id === confirmDeleteId
  );

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    const remark = formRemark.trim();
    if (isNaN(amount) || amount <= 0 || !remark) return;
    addPaymentRecord(formType, amount, remark);
    setFormAmount("");
    setFormRemark("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    deletePaymentRecord(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="relative min-h-dvh bg-surface-950 text-surface-50 font-sans">
      {/* ── Ambient background glows ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-pulse-glow absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[140px]" />
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-6 px-3 py-8 sm:px-5">
        {/* ── Back Button ────────────────────────────────────────────── */}
        <button
          id="btn-back"
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-surface-700/30 bg-surface-800/40 px-3.5 py-2 text-sm font-medium text-surface-300 backdrop-blur transition hover:border-emerald-500/30 hover:text-emerald-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        {/* ── Title ──────────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-surface-400">
            Financial Overview
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              Payments
            </span>
          </h1>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HORIZONTAL MONTH STRIP                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="-mx-3 sm:-mx-5">
          <div
            ref={stripRef}
            className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1 sm:px-5 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {availableMonths.map((month) => {
              const isCurrent = month === currentMonth;
              const isSelected = month === selectedMonth;

              return (
                <button
                  key={month}
                  type="button"
                  data-month={month}
                  onClick={() => handleMonthSelect(month)}
                  className={`relative flex shrink-0 cursor-pointer flex-col items-center rounded-2xl border px-4 py-2.5 transition-all duration-200 ${
                    isSelected
                      ? isCurrent
                        ? "border-emerald-500/40 bg-emerald-500/15 shadow-lg shadow-emerald-500/10"
                        : "border-surface-400/30 bg-surface-700/40 shadow-lg shadow-surface-700/10"
                      : "border-surface-700/20 bg-surface-800/30 hover:border-surface-600/30 hover:bg-surface-800/50"
                  }`}
                >
                  {/* Month short name */}
                  <span
                    className={`text-sm font-extrabold uppercase leading-none ${
                      isSelected
                        ? isCurrent
                          ? "text-emerald-300"
                          : "text-surface-100"
                        : "text-surface-300"
                    }`}
                  >
                    {getMonthShort(month)}
                  </span>

                  {/* Year */}
                  <span
                    className={`mt-1 text-[9px] font-medium uppercase tracking-wider ${
                      isSelected
                        ? isCurrent
                          ? "text-emerald-400/70"
                          : "text-surface-400"
                        : "text-surface-500/70"
                    }`}
                  >
                    {getYear(month)}
                  </span>

                  {/* Active dot indicator for current month */}
                  {isCurrent && (
                    <span className="absolute -top-0.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected month label ─────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2">
          <span className="h-px flex-1 bg-surface-700/30" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" />
            </svg>
            {isViewingCurrent ? "This Month" : getMonthFull(selectedMonth)}
            {!isViewingCurrent && (
              <span className="rounded-md bg-surface-700/40 px-1.5 py-0.5 text-[10px] font-semibold text-surface-500">
                READ ONLY
              </span>
            )}
          </span>
          <span className="h-px flex-1 bg-surface-700/30" />
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Income */}
          <div className="rounded-xl border border-emerald-400/10 bg-surface-800/40 px-2 py-4 text-center backdrop-blur-lg">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/80">
              Income
            </p>
            <p className="mt-1.5 text-xl sm:text-3xl font-extrabold tabular-nums text-emerald-400">
              {formatCurrency(monthIncome)}
            </p>
          </div>

          {/* Expense */}
          <div className="rounded-xl border border-rose-400/10 bg-surface-800/40 px-2 py-4 text-center backdrop-blur-lg">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400/80">
              Expense
            </p>
            <p className="mt-1.5 text-xl sm:text-3xl font-extrabold tabular-nums text-rose-400">
              {formatCurrency(monthExpense)}
            </p>
          </div>

          {/* Net Revenue */}
          <div
            className={`rounded-xl border bg-surface-800/40 px-2 py-4 text-center backdrop-blur-lg ${
              monthNet >= 0 ? "border-primary-400/10" : "border-rose-400/10"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">
              Net
            </p>
            <p
              className={`mt-1.5 text-xl sm:text-3xl font-extrabold tabular-nums ${
                monthNet >= 0 ? "text-primary-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(monthNet)}
            </p>
          </div>
        </div>

        {/* ── Payment Records List ───────────────────────────────────── */}
        {monthRecords && monthRecords.length > 0 ? (
          <section className="pb-20">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-surface-400">
              <span className="h-px flex-1 bg-surface-700/50" />
              {getMonthFull(selectedMonth)} History
              <span className="h-px flex-1 bg-surface-700/50" />
            </h2>
            <div className="flex flex-col gap-2">
              {monthRecords.map((record) => (
                <div
                  key={record.id}
                  className={`group flex items-center gap-3 rounded-xl border bg-surface-900/50 px-4 py-3.5 transition-all duration-250 ${
                    record.type === "income"
                      ? "border-emerald-400/10"
                      : "border-rose-400/10"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      record.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {record.type === "income" ? "↑" : "↓"}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-surface-50 truncate">
                      {record.remark}
                    </p>
                    <p className="mt-0.5 text-xs text-surface-400/70">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Amount */}
                  <div
                    className={`text-sm font-extrabold tabular-nums ${
                      record.type === "income"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {record.type === "income" ? "+" : "−"}
                    {formatCurrency(record.amount)}
                  </div>

                  {/* Delete button (only for manual payments, only current month) */}
                  {isViewingCurrent && !record.id.startsWith("patient_") && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(record.id)}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-surface-500 transition hover:bg-rose-500/10 hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                        <path
                          fillRule="evenodd"
                          d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center gap-2 py-12 text-center pb-20">
            <p className="text-4xl">🧾</p>
            <p className="text-sm text-surface-400">
              {isViewingCurrent
                ? "No payments recorded yet this month"
                : "No payments were recorded this month"}
            </p>
            {isViewingCurrent && (
              <p className="text-xs text-surface-400/50">
                Tap "Add Payment" below to log an income or expense
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Floating "Add Payment" Button (current month only) ────────── */}
      {isViewingCurrent && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition-transform active:scale-95"
          >
            <span className="text-lg">➕</span> Add Payment
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Delete Confirmation                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {confirmDeleteId && confirmDeleteRecordData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div
            className="absolute inset-0 z-0"
            onClick={() => setConfirmDeleteId(null)}
          />

          <div className="relative z-10 w-full max-w-sm animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-surface-50">
              Delete Payment?
            </h3>
            <p className="mt-2 text-sm text-surface-400">
              Are you sure you want to delete this{" "}
              {confirmDeleteRecordData.type} record for{" "}
              <span className="font-semibold text-surface-300">
                {formatCurrency(confirmDeleteRecordData.amount)}
              </span>
              ? This will adjust your total balance.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 cursor-pointer rounded-xl bg-surface-800 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-[1.5] cursor-pointer rounded-xl bg-rose-600 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Add Payment Form                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div
            className="absolute inset-0 z-0"
            onClick={() => setShowAddForm(false)}
          />

          <div className="relative z-10 w-full max-w-md animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-surface-400 transition hover:bg-surface-700/50 hover:text-surface-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">💸</span>
              <h3 className="text-lg font-bold text-surface-50">
                Add New Payment
              </h3>
            </div>
            <p className="mb-5 text-xs text-surface-400">
              Record a new income or expense manually.
            </p>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              {/* Type Switcher */}
              <div className="flex gap-2 rounded-xl bg-surface-800/60 p-1 border border-surface-700/50">
                <button
                  type="button"
                  onClick={() => setFormType("income")}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                    formType === "income"
                      ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                      : "text-surface-400 hover:text-surface-300"
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("expense")}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                    formType === "expense"
                      ? "bg-rose-500/20 text-rose-400 shadow-sm"
                      : "text-surface-400 hover:text-surface-300"
                  }`}
                >
                  Expense
                </button>
              </div>

              <div>
                <label
                  htmlFor="input-payment-amount"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300"
                >
                  Amount (₹)
                </label>
                <div className="relative">
                  <span
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${
                      formType === "income"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    ₹
                  </span>
                  <input
                    id="input-payment-amount"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    autoFocus
                    className={`w-full rounded-xl border border-surface-700/50 bg-surface-800/60 py-3 pl-9 pr-4 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:ring-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                      formType === "income"
                        ? "focus:border-emerald-500/50 focus:ring-emerald-500/20"
                        : "focus:border-rose-500/50 focus:ring-rose-500/20"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-payment-remark"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300"
                >
                  Remark
                </label>
                <input
                  id="input-payment-remark"
                  type="text"
                  placeholder="e.g. Utility Bill"
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  className={`w-full rounded-xl border border-surface-700/50 bg-surface-800/60 px-4 py-3 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:ring-2 ${
                    formType === "income"
                      ? "focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      : "focus:border-rose-500/50 focus:ring-rose-500/20"
                  }`}
                />
              </div>

              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-surface-700/50 bg-surface-800/40 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 cursor-pointer rounded-xl py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 z-100 ${
                    formType === "income"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                  disabled={
                    !formAmount ||
                    parseFloat(formAmount) <= 0 ||
                    !formRemark.trim()
                  }
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentsPage;
