// 온보딩 루틴 저장 api
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type CaffeineSensitivity = "LOW" | "NORMAL" | "HIGH";

export type IntakeFrequency = "RARELY" | "SOMETIMES" | "OFTEN" | "DAILY";

export interface RoutineRequest {
  weekdayRoutineName: string;
  weekendRoutineName: string;
  weekdayWakeTime: string;
  weekdaySleepTime: string;
  weekendWakeTime: string;
  weekendSleepTime: string;
  caffeineSensitivity: CaffeineSensitivity;
  intakeFrequency: IntakeFrequency;
}

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("ACCESS_TOKEN") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
};

const getAuthHeader = (token: string) => {
  if (token.startsWith("Bearer ")) {
    return token;
  }

  return `Bearer ${token}`;
};

const getErrorMessage = async (response: Response) => {
  const text = await response.text().catch(() => "");

  if (text) {
    try {
      const data = JSON.parse(text);

      if (data && typeof data.message === "string") {
        return data.message;
      }
    } catch {
      return text;
    }

    return text;
  }

  return `루틴 저장에 실패했어요. (${response.status})`;
};

export const saveRoutine = async (body: RoutineRequest) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("로그인 토큰이 없어요. 다시 로그인해주세요.");
  }

  const response = await fetch(`${BASE_URL}/api/users/me/routine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(accessToken),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const text = await response.text().catch(() => "");

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};