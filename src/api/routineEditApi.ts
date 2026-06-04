const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type CaffeineSensitivity = "LOW" | "NORMAL" | "HIGH";

export type IntakeFrequency = "RARELY" | "SOMETIMES" | "OFTEN" | "DAILY";

export type RoutineEditRequest = {
  weekdayRoutineName: string;
  weekendRoutineName: string;
  weekdayWakeTime: string;
  weekdaySleepTime: string;
  weekendWakeTime: string;
  weekendSleepTime: string;
  caffeineSensitivity: CaffeineSensitivity;
  intakeFrequency: IntakeFrequency;
};

export type RoutineEditResponse = {
  nickname: string;
  weekdayRoutineName: string;
  weekendRoutineName: string;
  sensitivity?: CaffeineSensitivity;
  caffeineSensitivity?: CaffeineSensitivity;
  intakeFrequency?: IntakeFrequency;
  weekdayWakeTime: string;
  weekdaySleepTime: string;
  weekendWakeTime: string;
  weekendSleepTime: string;
};

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

const getAuthHeaders = () => {
  const accessToken = getAccessToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();

  if (!response.ok) {
    let message = `요청에 실패했어요. ${response.status}`;

    if (text) {
      try {
        const errorData = JSON.parse(text);
        message = errorData.message || message;
      } catch {
        message = text;
      }
    }

    throw new Error(message);
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
};

export const getRoutineForEdit = async () => {
  const response = await fetch(`${BASE_URL}/api/users/me/routine`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseResponse<RoutineEditResponse>(response);
};

export const patchRoutineForEdit = async (body: RoutineEditRequest) => {
  const response = await fetch(`${BASE_URL}/api/users/me/routine`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse(response);
};