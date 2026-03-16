import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Line,
  Svg,
} from "@react-pdf/renderer";

const BRAND_COLOR = "#1a56db";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const ROW_ALT = "#f9fafb";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: DARK, fontFamily: "Helvetica" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brandBlock: { flexDirection: "column", gap: 3 },
  companyName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: BRAND_COLOR, letterSpacing: 0.5 },
  branchName: { fontSize: 11, color: DARK, fontFamily: "Helvetica-Bold" },
  branchDetail: { fontSize: 9, color: MUTED },
  invoiceTitleBlock: { alignItems: "flex-end", gap: 4 },
  invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: MUTED, textTransform: "uppercase" },
  invoiceNumber: { fontSize: 12, fontFamily: "Helvetica-Bold", color: DARK },
  invoiceDate: { fontSize: 9, color: MUTED },

  divider: { borderTopWidth: 2, borderTopColor: BRAND_COLOR, marginBottom: 20 },

  // Bill-to / details grid
  infoGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  infoBlock: { width: "45%" },
  infoLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  infoSub: { fontSize: 9, color: MUTED },

  // Table
  tableHeader: { flexDirection: "row", backgroundColor: BRAND_COLOR, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 3 },
  tableHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableRowAlt: { backgroundColor: ROW_ALT },
  colDesc: { flex: 1 },
  colQty: { width: 45, textAlign: "center" },
  colRate: { width: 75, textAlign: "right" },
  colAmt: { width: 80, textAlign: "right" },

  // Totals
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 0, marginBottom: 4, width: 240 },
  totalLabel: { width: 130, textAlign: "right", color: MUTED, fontSize: 9 },
  totalValue: { width: 80, textAlign: "right", fontSize: 9 },
  grandTotalRow: {
    flexDirection: "row", backgroundColor: BRAND_COLOR, paddingVertical: 7,
    paddingHorizontal: 10, borderRadius: 3, marginTop: 6, width: 240,
  },
  grandTotalLabel: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  grandTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // Footer
  footer: { position: "absolute", bottom: 30, left: 40, right: 40 },
  footerDivider: { borderTopWidth: 1, borderTopColor: BORDER, marginBottom: 8 },
  footerText: { fontSize: 8, color: MUTED, textAlign: "center" },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    alignSelf: "flex-start", marginBottom: 16,
  },
  statusText: { fontSize: 10, fontFamily: "Helvetica-Bold" },
});

type InvoiceItem = { description: string; quantity: number; unitPrice: { toString(): string } };

export type InvoiceData = {
  companyName: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  invoiceNumber: string;
  invoiceDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  vehicleNumber?: string;
  items: InvoiceItem[];
  subtotal: { toString(): string };
  tax: { toString(): string };
  total: { toString(): string };
  status?: string;
  taxRate?: string;
};

const fmt = (v: { toString(): string } | number) => {
  const n = typeof v === "number" ? v : parseFloat(v.toString());
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PAID:      { bg: "#d1fae5", text: "#065f46" },
  PENDING:   { bg: "#fef3c7", text: "#92400e" },
  OVERDUE:   { bg: "#fee2e2", text: "#991b1b" },
  CANCELLED: { bg: "#f3f4f6", text: "#374151" },
};

export function InvoicePdfDocument({ data }: { data: InvoiceData }) {
  const statusColor = data.status ? (STATUS_COLORS[data.status] ?? STATUS_COLORS.PENDING) : null;
  const today = data.invoiceDate ?? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.companyName}>Motor Auto Care</Text>
            {data.branchName && <Text style={styles.branchName}>{data.branchName}</Text>}
            {data.branchAddress && <Text style={styles.branchDetail}>{data.branchAddress}</Text>}
            {data.branchPhone  && <Text style={styles.branchDetail}>{data.branchPhone}</Text>}
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>{today}</Text>
          </View>
        </View>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Status badge ────────────────────────────────────────────────── */}
        {statusColor && (
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {data.status}
            </Text>
          </View>
        )}

        {/* ── Bill-to / Vehicle grid ──────────────────────────────────────── */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Billed To</Text>
            <Text style={styles.infoValue}>{data.customerName}</Text>
            <Text style={styles.infoSub}>{data.customerPhone}</Text>
            {data.customerAddress && <Text style={styles.infoSub}>{data.customerAddress}</Text>}
          </View>
          {data.vehicleNumber && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>{data.vehicleNumber}</Text>
            </View>
          )}
        </View>

        {/* ── Items table ─────────────────────────────────────────────────── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
          <Text style={[styles.tableHeaderText, styles.colAmt]}>Amount</Text>
        </View>
        {data.items.map((item: any, i: number) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={[{ fontSize: 10 }, styles.colQty]}>{item.quantity}</Text>
            <Text style={[{ fontSize: 10 }, styles.colRate]}>{fmt(item.unitPrice)}</Text>
            <Text style={[{ fontSize: 10 }, styles.colAmt]}>{fmt(Number(item.unitPrice) * item.quantity)}</Text>
          </View>
        ))}

        {/* ── Totals ──────────────────────────────────────────────────────── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Tax{data.taxRate ? ` (${data.taxRate}%)` : ""}
            </Text>
            <Text style={styles.totalValue}>{fmt(data.tax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.total)}</Text>
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            Motor Auto Care{data.branchName ? ` — ${data.branchName}` : ""} · Thank you for your business!
          </Text>
        </View>

      </Page>
    </Document>
  );
}


