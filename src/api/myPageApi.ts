// 마이페이지 api
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type RoutineResponse = {
  nickname: string;
  weekdayRoutineName: string;
  weekendRoutineName: string;
  sensitivity: string;
  weekdayWakeTime: string;
  weekdaySleepTime: string;
  weekendWakeTime: string;
  weekendSleepTime: string;
};

export type WeeklyStatistic = {
  dayOfWeek: string;
  totalCaffeine: number;
  riskLevel: string;
};

export type WeeklyStatsResponse = {
  nickname: string;
  sensitivity: string;
  routineType: string;
  weeklyStatistics: WeeklyStatistic[];
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

const getAccessToken = () => {
  const keys = ["accessToken", "ACCESS_TOKEN", "token", "access_token"];

  for (const key of keys) {
    const localToken = localStorage.getItem(key);
    if (localToken) return localToken;

    const sessionToken = sessionStorage.getItem(key);
    if (sessionToken) return sessionToken;
  }

  return "";
};

const normalizeBearerToken = (token: string) => {
  return token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
};

const authHeaders = (): Record<string, string> => {
  const token = getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: normalizeBearerToken(token),
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  return response.json();
};

const parseResponseBody = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getErrorMessage = (body: unknown, fallback: string) => {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (typeof body === "object" && body !== null) {
    const data = body as { message?: unknown; error?: unknown };

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return fallback;
};

export const getMyRoutine = async () => {
  const response = await fetch(`${BASE_URL}/api/users/me/routine`, {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });

  return handleResponse<RoutineResponse>(response);
};

export const getWeeklyStats = async () => {
  const response = await fetch(`${BASE_URL}/api/report/stats`, {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });

  return handleResponse<WeeklyStatsResponse>(response);
};

export const logout = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`로그아웃 실패: ${response.status}`);
  }

  return response.text();
};

export const withdrawUser = async () => {
  const token = getAccessToken();

  if (!token) {
    throw new Error("로그인 정보가 없습니다. 다시 로그인해 주세요.");
  }

  const response = await fetch(`${BASE_URL}/api/user/withdraw`, {
    method: "DELETE",
    headers: {
      Authorization: normalizeBearerToken(token),
      Accept: "application/json",
    },
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, `회원 탈퇴 실패: ${response.status}`));
  }

  if (typeof body === "object" && body !== null) {
    const data = body as ApiResponse<string>;
    return data.data || data.message || "회원 탈퇴가 완료되었습니다.";
  }

  return body || "회원 탈퇴가 완료되었습니다.";
};