
 // src/api.ts
 // Helpers for browser-to-Express requests.

export type Message = {
  _id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

type BackendError = {
  error?: string;
};

// Uses the deployed Render URL in production.
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '');

type RequestOptions = RequestInit | undefined;

async function getRequestError(
  response: Response,
  action: string
): Promise<Error> {
  let serverMessage = '';

  try {
    const data = (await response.json()) as BackendError;
    serverMessage = data.error?.trim() || '';
  } catch {
    serverMessage = '';
  }

  const reason =
    serverMessage ||
    response.statusText ||
    'The server did not provide more details.';

  return new Error(
    `${action} failed (HTTP ${response.status}): ${reason}`
  );
}

async function request<T>(
  path: string,
  options: RequestOptions,
  action: string
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : 'The browser could not reach the backend.';

    throw new Error(
      `${action} failed: Could not connect to the backend at ${url}. ${reason}`
    );
  }

  if (!response.ok) {
    throw await getRequestError(response, action);
  }

  return response.json() as Promise<T>;
}

// GET /api/messages
export function fetchMessages(): Promise<Message[]> {
  return request<Message[]>(
    '/api/messages',
    undefined,
    'Loading messages'
  );
}

// POST /api/messages
export function saveMessage(text: string): Promise<Message> {
  return request<Message>(
    '/api/messages',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
    'Saving message'
  );
}

// DELETE /api/messages/:id
export async function deleteMessage(id: string): Promise<void> {
  await request<{ success: boolean }>(
    `/api/messages/${id}`,
    { method: 'DELETE' },
    'Deleting message'
  );
}
