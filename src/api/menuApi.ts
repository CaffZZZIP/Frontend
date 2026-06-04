const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

type ApiResponse<T> = {
  code: number;
  message: string;
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
  todayTotalCaffeineMg?: number;
  todayCaffeineMg?: number;
  currentTotalCaffeineMg?: number;
  dailyLimitMg?: number;
  dailyRecommendedCaffeineMg?: number;
  recommendedCaffeineMg?: number;
  riskLevel?: string;
  riskType?: string;
  status?: string;
  riskMessage?: string;
  analysisMessage?: string;
  guideMessage?: string;
  description?: string;
  [key: string]: unknown;
};

export type IntakeRequest = {
  menuId: number;
  intakeAt?: string;
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
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
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

  if (!response.ok) {
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

export async function getMenuDetail(menuId: number) {
  return request<MenuDetail>(`/api/menus/${menuId}`);
}

export async function createIntake(payload: IntakeRequest) {
  return request<IntakeResponse>("/api/intake", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}