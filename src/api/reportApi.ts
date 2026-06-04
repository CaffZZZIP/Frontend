const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type ReportRiskLevel = "SAFE" | "CAUTION" | "DANGER" | string;

export type SleepImpactLevel = "LOW" | "MID" | "HIGH" | string;

export interface ReportIntakeItem {
  menuId: number;
  menuName: string;
  brand: string;
  caffeineMg: number;
  intakeAt?: string;
  intakeTime?: string;
  quantity?: number;
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
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

const getAuthHeaders = () => {
  const token = getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
  };
};

const createUrl = (path: string) => {
  return `${BASE_URL}${path}`;
};

export const getTodayReport = async (): Promise<TodayReportResponse> => {
  const response = await fetch(createUrl("/api/report/today"), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
    },
  });

  let body: ApiResponse<TodayReportResponse> | TodayReportResponse | null = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body && "message" in body && body.message
        ? body.message
        : "오늘의 카페인 리포트를 불러오지 못했어요.";
    throw new Error(message);
  }

  if (body && "data" in body) {
    return normalizeTodayReport(body.data);
  }

  return normalizeTodayReport(body as TodayReportResponse);
};

const normalizeTodayReport = (data?: TodayReportResponse | null): TodayReportResponse => {
  return {
    totalCaffeine: Number(data?.totalCaffeine || 0),
    remainingCaffeine: Number(data?.remainingCaffeine || 0),
    bedtimeRemainingCaffeine: Number(data?.bedtimeRemainingCaffeine || 0),
    riskLevel: data?.riskLevel || "SAFE",
    recommendedSleepTime: data?.recommendedSleepTime || "",
    sleepImpactLevel: data?.sleepImpactLevel || "LOW",
    analysisMessage: data?.analysisMessage || "",
    intakeList: Array.isArray(data?.intakeList) ? data.intakeList : [],
    reportDate: data?.reportDate,
    routineName: data?.routineName,
    routineType: data?.routineType,
  };
};