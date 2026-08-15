import type { DeviceFormData, DeviceRecord } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  return response;
}

export async function getDevices(): Promise<DeviceRecord[]> {
  const response = await fetch(`${API_URL}/devices`);
  await handleResponse(response);
  return response.json();
}

export async function getDevice(id: string): Promise<DeviceRecord> {
  const response = await fetch(`${API_URL}/devices/${id}`);
  await handleResponse(response);
  return response.json();
}

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

export async function deleteDevice(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: "DELETE",
  });

  await handleResponse(response);
}
