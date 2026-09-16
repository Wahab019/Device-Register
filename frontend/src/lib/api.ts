import type { DeviceFormData, DeviceListParams, DeviceListResponse, DeviceRecord } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Keep response validation in one place so every endpoint exposes the same
// error shape to the UI instead of silently accepting non-2xx responses.
// Checks whether an API response succeeded. For failed requests, it reads the
// server's error message and throws an error containing the status and details.
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  return response;
}

// Sends a GET request to the devices endpoint and returns one page of records
// after validating the server response.
export async function getDevices(params: DeviceListParams = {}): Promise<DeviceListResponse> {
  // Build the query with URLSearchParams so values are encoded correctly and
  // the backend receives only filters that the caller intentionally supplied.
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.sortBy) searchParams.set("sort_by", params.sortBy);
  if (params.sortDirection) searchParams.set("sort_direction", params.sortDirection);

  const query = searchParams.toString();
  const response = await fetch(`${API_URL}/devices${query ? `?${query}` : ""}`);
  await handleResponse(response);
  return response.json();
}

// Sends a GET request for the device identified by `id`, validates the result,
// and returns the matching device record.
export async function getDevice(id: string): Promise<DeviceRecord> {
  const response = await fetch(`${API_URL}/devices/${id}`);
  await handleResponse(response);
  return response.json();
}

// Sends the form data as a JSON POST request to create a new device. The
// newly created device record is returned after the response is validated.
export async function createDevice(data: DeviceFormData): Promise<DeviceRecord> {
  // The form sends optional empty values as null, matching the API model's
  // distinction between an omitted detail and a meaningful string value.
  const response = await fetch(`${API_URL}/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  await handleResponse(response);
  return response.json();
}

// Sends the updated form data as a JSON PUT request for the device identified
// by `id`, then returns the updated device record.
export async function updateDevice(
  id: string,
  data: DeviceFormData,
): Promise<DeviceRecord> {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  await handleResponse(response);
  return response.json();
}

// Sends a DELETE request for the device identified by `id`. Successful
// deletion returns no data, while failed responses are handled consistently.
export async function deleteDevice(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "DELETE",
  });

  await handleResponse(response);
}
