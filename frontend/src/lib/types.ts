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

export type DeviceListResponse = {
  items: DeviceRecord[];
  total: number;
  page: number;
  page_size: number;
};

export type DeviceListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DeviceRecord["status"] | "all";
  sortBy?: "customer_name" | "date_received" | "status";
  sortDirection?: "asc" | "desc";
};
