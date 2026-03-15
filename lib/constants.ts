export const JOB_CARD_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Rent" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "TOOLS", label: "Tools" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "OTHER", label: "Other" },
] as const;

export const STAFF_ROLES = [
  { value: "MECHANIC", label: "Mechanic" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
  { value: "HELPER", label: "Helper" },
] as const;

export const APP_ROLES = ["Admin", "Manager", "Technician"] as const;
export type AppRole = (typeof APP_ROLES)[number];
