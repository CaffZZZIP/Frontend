export type RoutineType = "WEEKDAY" | "WEEKEND";

export interface MainRoutineResponse {
  routineName: string;
  wakeTime: string;
  sleepTime: string;
}

export interface CaffeineSummaryResponse {
  totalCaffeine: number;
  remainingCaffeine: number;
  remainingSafeAmount: number;
  riskLevel: string;
  sleepImpactLevel: string;
}

export interface DailyQuoteResponse {
  message: string;
}

export interface IntakePreviewItem {
  menuName: string;
  brand: string;
  caffeineMg: number;
  intakeTime: string;
}

interface ApiResponse<T> {
  code?: number;
  status?: number;
  success?: boolean;
  message?: string;
  data: T;
}

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://52.79.54.46:8080"
).replace(/\/$/, "");

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    sessionStorage.getItem("ACCESS_TOKEN") ||
    ""
  );
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAccessToken();
  const hasBody = options.body !== undefined;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let parsed: unknown = null;

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof (parsed as { message?: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : "요청 처리 중 오류가 발생했어요.";

    throw new Error(message);
  }

  if (parsed && typeof parsed === "object" && "data" in parsed) {
    return (parsed as ApiResponse<T>).data;
  }

  return parsed as T;
};

export const selectRoutineMode = (routineType: RoutineType) => {
  return request<string>("/api/main/routine-mode", {
    method: "POST",
    body: JSON.stringify({ routineType }),
  });
};

export const getMainRoutine = () => {
  return request<MainRoutineResponse>("/api/main/routine");
};

export const getCaffeineSummary = () => {
  return request<CaffeineSummaryResponse>("/api/main/caffeine-summary");
};

export const getDailyQuote = () => {
  return request<DailyQuoteResponse>("/api/main/daily-quote");
};

export const getIntakePreview = () => {
  return request<IntakePreviewItem[]>("/api/main/intake-preview");
};