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

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

const authHeaders = () => {
  const token = getAccessToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  return response.json();
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
  const response = await fetch(`${BASE_URL}/api/user/withdraw`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`회원 탈퇴 실패: ${response.status}`);
  }

  return response.text();
};