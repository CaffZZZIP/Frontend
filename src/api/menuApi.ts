// 메뉴 선택 1~3페이지 api
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

type ApiResponse<T> = {
  code?: number;
  status?: number;
  success?: boolean;
  message?: string;
  data: T;
};

export type MenuBrand = {
  brand: string;
  imageUrl?: string;
  brandImageUrl?: string;
  logoUrl?: string;
  [key: string]: unknown;
};

export type MenuItem = {
  menuId: number;
  menuName: string;
  brand: string;
  categoryName: string;
  caffeineMg: number;
  imageUrl?: string;
  menuImageUrl?: string;
  [key: string]: unknown;
};

export type MenuDetail = MenuItem & {
  quantity?: number;
  intakeCaffeine?: number;
  intakeCaffeineMg?: number;
  todayTotalCaffeine?: number;
  todayTotalCaffeineMg?: number;
  todayCaffeineMg?: number;
  currentTotalCaffeineMg?: number;
  totalCaffeineMg?: number;
  expectedTotalCaffeine?: number;
  expectedTotalCaffeineMg?: number;
  dailyRecommendedLimit?: number;
  dailyLimitMg?: number;
  dailyRecommendedCaffeineMg?: number;
  recommendedCaffeineMg?: number;
  recommendedDailyCaffeineMg?: number;
  maxCaffeineMg?: number;
  riskLevel?: string;
  riskLabel?: string;
  riskType?: string;
  status?: string;
  caffeineSensitivity?: string;
  expectedRemainingCaffeine?: number;
  riskMessage?: string;
  analysisMessage?: string;
  guideMessage?: string;
  description?: string;
  isFavorite?: boolean;
  favorite?: boolean;
  favorited?: boolean;
  [key: string]: unknown;
};

export type GetMenuDetailParams = {
  intakeAt?: string;
  quantity?: number;
};

export type IntakeRequest = {
  menuId: number;
  intakeAt: string;
  quantity: number;
};

export type IntakeResponse = {
  intakeId: number;
  menuId: number;
  menuName: string;
  brand: string;
  routineType: "WEEKDAY" | "WEEKEND" | string;
  intakeAt: string;
  quantity: number;
  totalCaffeine: number;
};

function getAccessToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("ACCESS_TOKEN") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

export function resolveMenuImageUrl(imageUrl?: string) {
  const trimmedUrl = imageUrl?.trim();

  if (!trimmedUrl) {
    return undefined;
  }

  if (
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("https://") ||
    trimmedUrl.startsWith("//") ||
    trimmedUrl.startsWith("data:") ||
    trimmedUrl.startsWith("blob:")
  ) {
    return trimmedUrl;
  }

  return `${BASE_URL}${trimmedUrl.startsWith("/") ? "" : "/"}${trimmedUrl}`;
}

export async function getAuthorizedImageObjectUrl(imageUrl?: string) {
  const resolvedUrl = resolveMenuImageUrl(imageUrl);

  if (!resolvedUrl) {
    return undefined;
  }

  if (resolvedUrl.startsWith("data:") || resolvedUrl.startsWith("blob:")) {
    return resolvedUrl;
  }

  try {
    const headers = new Headers();
    headers.set("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");

    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(resolvedUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return undefined;
    }

    const blob = await response.blob();

    if (!blob.size) {
      return undefined;
    }

    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const result = text ? (JSON.parse(text) as ApiResponse<T>) : ({ data: undefined } as ApiResponse<T>);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "요청에 실패했어요.");
  }

  return result.data;
}

export async function getMenuBrands() {
  return request<MenuBrand[]>("/api/menus/brands");
}

export async function getMenus(params?: { brand?: string; categoryId?: number }) {
  const searchParams = new URLSearchParams();

  if (params?.brand) {
    searchParams.set("brand", params.brand);
  }

  if (params?.categoryId) {
    searchParams.set("categoryId", String(params.categoryId));
  }

  const query = searchParams.toString();

  return request<MenuItem[]>(query ? `/api/menus?${query}` : "/api/menus");
}

export async function searchMenus(params: { keyword: string; brand?: string }) {
  const searchParams = new URLSearchParams();
  searchParams.set("keyword", params.keyword);

  if (params.brand) {
    searchParams.set("brand", params.brand);
  }

  return request<MenuItem[]>(`/api/menus/search?${searchParams.toString()}`);
}

export async function getMenusByCategory(categoryId: number) {
  return request<MenuItem[]>(`/api/menus/category/${categoryId}`);
}

export async function getMenuDetail(menuId: number, params?: GetMenuDetailParams) {
  const searchParams = new URLSearchParams();

  if (params?.intakeAt) {
    searchParams.set("intakeAt", params.intakeAt);
  }

  if (params?.quantity !== undefined) {
    searchParams.set("quantity", String(params.quantity));
  }

  const query = searchParams.toString();

  return request<MenuDetail>(query ? `/api/menus/${menuId}?${query}` : `/api/menus/${menuId}`);
}

export async function createIntake(payload: IntakeRequest) {
  return request<IntakeResponse>("/api/intake", {
    method: "POST",
    body: JSON.stringify({
      menuId: payload.menuId,
      intakeAt: payload.intakeAt,
      quantity: payload.quantity,
    }),
  });
}