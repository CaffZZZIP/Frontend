// 줄겨찾기 api
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type FavoriteMenu = {
  favoriteId: number;
  menuId: number;
  menuName: string;
  brand: string;
  categoryName: string;
  caffeineMg: number;
  imageUrl?: string;
  menuImageUrl?: string;
};

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAccessToken();
  const hasBody = options.body !== undefined;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  const result = text ? (JSON.parse(text) as ApiResponse<T>) : null;

  if (!response.ok) {
    throw new Error(result?.message || "요청 처리에 실패했어요.");
  }

  if (result && typeof result === "object" && "data" in result) {
    return result.data;
  }

  return result as T;
};

export const getFavorites = () => {
  return request<FavoriteMenu[]>("/api/favorites", {
    method: "GET",
  });
};

export const addFavorite = (menuId: number) => {
  return request<FavoriteMenu>(`/api/favorites/${menuId}`, {
    method: "POST",
  });
};

export const deleteFavorite = (menuId: number) => {
  return request<string>(`/api/favorites/${menuId}`, {
    method: "DELETE",
  });
};