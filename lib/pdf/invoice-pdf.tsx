import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  title: { fontSize: 18, marginBottom: 20 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 120 },
  table: { marginTop: 20 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 6 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, paddingVertical: 6, fontWeight: "bold" },
  colDesc: { flex: 2 },
  colQty: { width: 50, textAlign: "right" },
  colRate: { width: 70, textAlign: "right" },
  colAmt: { width: 70, textAlign: "right" },
  totalRow: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end", gap: 20 },
});

type InvoiceItem = { description: string; quantity: number; unitPrice: { toString(): string } };
type InvoiceData = {
  garageName: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  vehicleNumber?: string;
  items: InvoiceItem[];
  subtotal: { toString(): string };
  tax: { toString(): string };
  total: { toString(): string };
};

export function InvoicePdfDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.garageName}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Invoice #</Text>
          <Text>{data.invoiceNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Customer</Text>
          <Text>{data.customerName} · {data.customerPhone}</Text>
        </View>
        {data.vehicleNumber && (
          <View style={styles.row}>
            <Text style={styles.label}>Vehicle</Text>
            <Text>{data.vehicleNumber}</Text>
          </View>
        )}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colAmt}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>₹{item.unitPrice.toString()}</Text>
              <Text style={styles.colAmt}>₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totalRow}>
          <Text>Subtotal: ₹{data.subtotal.toString()}</Text>
          <Text>Tax: ₹{data.tax.toString()}</Text>
          <Text style={{ fontWeight: "bold" }}>Total: ₹{data.total.toString()}</Text>
        </View>
      </Page>
    </Document>
  );
}
