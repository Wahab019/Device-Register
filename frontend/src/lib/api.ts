import type {
  AuthResponse,
  Charge,
  ChargeFormData,
  ChargesSummary,
  DeviceFormData,
  DeviceListParams,
  DeviceListResponse,
  DeviceRecord,
  DeviceTrackRecord,
  StaffUser,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper to provide staff authentication headers for internal endpoints
export function getStaffHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("staff_access_token") : null;
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  const legacyKey = typeof window !== "undefined" ? localStorage.getItem("staff_api_key") : null;
  const envKey = process.env.NEXT_PUBLIC_STAFF_API_KEY;
  const key = legacyKey || envKey;

  if (key) {
    return {
      "x-staff-key": key,
      Authorization: `Bearer ${key}`,
    };
  }
  return {};
}

// Keep response validation in one place so every endpoint exposes the same
// error shape to the UI instead of silently accepting non-2xx responses.
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  return response;
}

// Sends a GET request to the devices endpoint and returns one page of records
export async function getDevices(params: DeviceListParams = {}): Promise<DeviceListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.sortBy) searchParams.set("sort_by", params.sortBy);
  if (params.sortDirection) searchParams.set("sort_direction", params.sortDirection);

  const query = searchParams.toString();
  const response = await fetch(`${API_URL}/devices${query ? `?${query}` : ""}`, {
    headers: {
      ...getStaffHeaders(),
    },
  });
  await handleResponse(response);
  return response.json();
}

// Sends a GET request for the device identified by `id`
export async function getDevice(id: string): Promise<DeviceRecord> {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    headers: {
      ...getStaffHeaders(),
    },
  });
  await handleResponse(response);
  return response.json();
}

// Sends the form data as a JSON POST request to create a new device
export async function createDevice(data: DeviceFormData): Promise<DeviceRecord> {
  const response = await fetch(`${API_URL}/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getStaffHeaders(),
    },
    body: JSON.stringify(data),
  });

  await handleResponse(response);
  return response.json();
}

// Sends the updated form data as a JSON PUT request for the device identified by `id`
export async function updateDevice(
  id: string,
  data: DeviceFormData,
): Promise<DeviceRecord> {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getStaffHeaders(),
    },
    body: JSON.stringify(data),
  });

  await handleResponse(response);
  return response.json();
}

// Sends a DELETE request for the device identified by `id`
export async function deleteDevice(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "DELETE",
    headers: {
      ...getStaffHeaders(),
    },
  });

  await handleResponse(response);
}

// Sends a GET request to the public tracking endpoint for a ticket code (NO AUTH REQUIRED)
export async function trackDevice(ticketCode: string): Promise<DeviceTrackRecord> {
  const response = await fetch(`${API_URL}/track/${encodeURIComponent(ticketCode.trim())}`);
  await handleResponse(response);
  return response.json();
}

// Fetches the list of charges and computed total for a device
export async function getCharges(deviceId: string): Promise<ChargesSummary> {
  const response = await fetch(`${API_URL}/devices/${deviceId}/charges`, {
    headers: {
      ...getStaffHeaders(),
    },
  });
  await handleResponse(response);
  return response.json();
}

// Adds a new charge for a device
export async function addCharge(
  deviceId: string,
  data: ChargeFormData,
): Promise<Charge> {
  const response = await fetch(`${API_URL}/devices/${deviceId}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getStaffHeaders(),
    },
    body: JSON.stringify(data),
  });
  await handleResponse(response);
  return response.json();
}

// Deletes a charge from a device
export async function deleteCharge(deviceId: string, chargeId: string): Promise<void> {
  const response = await fetch(`${API_URL}/devices/${deviceId}/charges/${chargeId}`, {
    method: "DELETE",
    headers: {
      ...getStaffHeaders(),
    },
  });
  await handleResponse(response);
}

// Staff authentication endpoints
export async function loginStaff(data: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleResponse(response);
  return response.json();
}

export async function signupStaff(data: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleResponse(response);
  return response.json();
}

export async function getMe(): Promise<StaffUser> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      ...getStaffHeaders(),
    },
  });
  await handleResponse(response);
  return response.json();
}
