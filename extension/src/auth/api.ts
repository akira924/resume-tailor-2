export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: 'admin' | 'user';
  isActive: number;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

// ----------------------------------------------------------------------

export class ApiError extends Error {
  /** Undefined when the server could not be reached at all. */
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${__API_URL__}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Could not reach the server. Please try again.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status);
  }

  return data as T;
}

// ----------------------------------------------------------------------

export const signIn = (email: string, password: string) =>
  request<{ accessToken: string }>('/api/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

/** Registering doesn't sign the user in: an admin has to approve the account first. */
export const signUp = (params: SignUpParams) =>
  request<{ user: User }>('/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(params),
  });

export const getMe = (accessToken: string) =>
  request<{ user: User }>('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

/** `resume` is null until the user first saves on the website. */
export const getSavedResume = (accessToken: string) =>
  request<{ resume: { settings: Record<string, unknown> } | null }>('/api/resume', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
