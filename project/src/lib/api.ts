export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
}

export async function apiGet<T>(path: string, accessToken?: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `API GET failed with status ${response.status}`)
  }

  return await response.json() as T
}
