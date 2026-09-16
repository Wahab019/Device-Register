// The complete representation returned by the backend for an existing record.
// Nullable fields are optional in the database and are rendered with a UI
// fallback when no value has been recorded.
export type DeviceRecord = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  device_type: string;
  device_brand: string | null;
  device_model: string | null;
  serial_number: string | null;
  issue_description: string;
  status: "pending" | "in_progress" | "completed" | "picked_up";
  date_received: string;
  date_completed: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// The editable subset of a record. New records can omit server-managed fields
// and optional form values are normalized before they reach the API.
export type DeviceFormData = {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  device_type: string;
  device_brand?: string | null;
  device_model?: string | null;
  serial_number?: string | null;
  issue_description: string;
  status?: "pending" | "in_progress" | "completed" | "picked_up";
  date_received?: string;
  notes?: string | null;
};

// A paginated response keeps the current slice and total count together so the
// dashboard can append pages while still showing accurate progress.
export type DeviceListResponse = {
  items: DeviceRecord[];
  total: number;
  page: number;
  page_size: number;
};

// Query options use frontend-friendly camelCase names; api.ts maps them to the
// snake_case query parameters expected by the backend.
export type DeviceListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DeviceRecord["status"] | "all";
  sortBy?: "customer_name" | "date_received" | "status";
  sortDirection?: "asc" | "desc";
};
