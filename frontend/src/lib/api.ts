import type { DeviceFormData, DeviceRecord } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Checks whether an API response succeeded. For failed requests, it reads the
// server's error message and throws an error containing the status and details.
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  return response;
}

// Sends a GET request to the devices endpoint and returns every registered
// device after validating the server response.
export async function getDevices(): Promise<DeviceRecord[]> {
  const response = await fetch(`${API_URL}/devices`);
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
