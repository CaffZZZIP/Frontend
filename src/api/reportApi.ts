// 리포트 페이지 api
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type ReportRiskLevel = "SAFE" | "CAUTION" | "DANGER" | string;

export type SleepImpactLevel = "LOW" | "MID" | "HIGH" | string;

export interface ReportIntakeItem {
  intakeId?: number;
  id?: number;
  intakeRecordId?: number;
  userIntakeId?: number;
  menuId: number;
  menuName: string;
  brand: string;
  caffeineMg: number;
  totalCaffeine?: number;
  intakeAt?: string;
  intakeTime?: string;
  quantity?: number;
  routineType?: string;
}

export interface TodayReportResponse {
  totalCaffeine: number;
  remainingCaffeine: number;
  bedtimeRemainingCaffeine: number;
  riskLevel: ReportRiskLevel;
  recommendedSleepTime: string;
  sleepImpactLevel: SleepImpactLevel;
  analysisMessage: string;
  intakeList: ReportIntakeItem[];
  reportDate?: string;
  routineName?: string;
  routineType?: string;
  dailyRecommendedLimit?: number;
}

export interface UpdateIntakeRequest {
  intakeAt: string;
  quantity: number;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const getAccessToken = (): string => {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

const getAuthHeaders = (hasBody = false): HeadersInit => {
  const headers = new Headers();

  headers.set("Accept", "application/json");

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", token.startsWith("Bearer ") ? token : `Bearer ${token}`);
  }

  return headers;
};

const createUrl = (path: string) => {
  return `${BASE_URL}${path}`;
};

const readBody = async <T>(response: Response): Promise<ApiResponse<T> | T | null> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = <T>(body: ApiResponse<T> | T | null, fallback: string) => {
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }

  return fallback;
};

const unwrapData = <T>(body: ApiResponse<T> | T | null): T | null => {
  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }

  return body as T | null;
};

export const getTodayReport = async (): Promise<TodayReportResponse> => {
  const response = await fetch(createUrl("/api/report/today"), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const body = await readBody<unknown>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, "오늘의 카페인 리포트를 불러오지 못했어요."));
  }

  return normalizeTodayReport(unwrapData<unknown>(body));
};

export const getTodayIntakeList = async (): Promise<ReportIntakeItem[]> => {
  const response = await fetch(createUrl("/api/intake/today"), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const body = await readBody<unknown>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, "오늘 섭취 목록을 불러오지 못했어요."));
  }

  return normalizeIntakeList(unwrapData<unknown>(body));
};

export const updateIntake = async (intakeId: number, request: UpdateIntakeRequest): Promise<ReportIntakeItem | null> => {
  const response = await fetch(createUrl(`/api/intake/${intakeId}`), {
    method: "PATCH",
    headers: getAuthHeaders(true),
    body: JSON.stringify(request),
  });

  const body = await readBody<unknown>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, "섭취 기록을 수정하지 못했어요."));
  }

  const data = unwrapData<unknown>(body);

  if (!data || typeof data !== "object") {
    return null;
  }

  return normalizeIntakeItem(data);
};

export const deleteIntake = async (intakeId: number): Promise<void> => {
  const response = await fetch(createUrl(`/api/intake/${intakeId}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const body = await readBody<unknown>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, "섭취 기록을 삭제하지 못했어요."));
  }
};

const normalizeTodayReport = (data?: unknown): TodayReportResponse => {
  const value = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  return {
    totalCaffeine: getNumber(value.totalCaffeine, 0),
    remainingCaffeine: getNumber(value.remainingCaffeine, 0),
    bedtimeRemainingCaffeine: getNumber(value.bedtimeRemainingCaffeine, 0),
    riskLevel: getString(value.riskLevel) || "SAFE",
    recommendedSleepTime: getString(value.recommendedSleepTime),
    sleepImpactLevel: getString(value.sleepImpactLevel) || "LOW",
    analysisMessage: getString(value.analysisMessage),
    intakeList: normalizeIntakeList(value.intakeList),
    reportDate: getString(value.reportDate) || undefined,
    routineName: getString(value.routineName) || undefined,
    routineType: getString(value.routineType) || undefined,
    dailyRecommendedLimit: getNumber(value.dailyRecommendedLimit, 400),
  };
};

const normalizeIntakeList = (data?: unknown): ReportIntakeItem[] => {
  if (Array.isArray(data)) {
    return data.map(normalizeIntakeItem);
  }

  if (data && typeof data === "object") {
    const value = data as Record<string, unknown>;

    if (Array.isArray(value.intakeList)) {
      return value.intakeList.map(normalizeIntakeItem);
    }

    if (Array.isArray(value.list)) {
      return value.list.map(normalizeIntakeItem);
    }

    if (Array.isArray(value.items)) {
      return value.items.map(normalizeIntakeItem);
    }

    if (Array.isArray(value.content)) {
      return value.content.map(normalizeIntakeItem);
    }
  }

  return [];
};

const normalizeIntakeItem = (item: unknown): ReportIntakeItem => {
  const value = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const quantity = getNumber(value.quantity, 1);
  const caffeineMg = getNumber(value.caffeineMg, value.caffeine, value.caffeineAmount, value.menuCaffeine, 0);
  const totalCaffeine = getNumber(value.totalCaffeine, caffeineMg * quantity);

  return {
    intakeId: getOptionalNumber(value.intakeId, value.id, value.intakeRecordId, value.userIntakeId),
    id: getOptionalNumber(value.id),
    intakeRecordId: getOptionalNumber(value.intakeRecordId),
    userIntakeId: getOptionalNumber(value.userIntakeId),
    menuId: getNumber(value.menuId, 0),
    menuName: getString(value.menuName, value.name),
    brand: getString(value.brand, value.brandName),
    caffeineMg,
    totalCaffeine,
    intakeAt: getString(value.intakeAt, value.createdAt) || undefined,
    intakeTime: getString(value.intakeTime) || undefined,
    quantity,
    routineType: getString(value.routineType) || undefined,
  };
};

const getNumber = (...values: unknown[]) => {
  const fallback = Number(values[values.length - 1] ?? 0);

  for (const value of values.slice(0, -1)) {
    const numberValue = Number(value);

    if (Number.isFinite(numberValue)) {
      return numberValue;
    }
  }

  return Number.isFinite(fallback) ? fallback : 0;
};

const getOptionalNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numberValue = Number(value);

    if (Number.isFinite(numberValue) && numberValue > 0) {
      return numberValue;
    }
  }

  return undefined;
};

const getString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
};