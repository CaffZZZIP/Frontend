// 메뉴 상세 기록 페이지
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import { addFavorite, deleteFavorite, getFavorites } from "../../api/favoriteApi";
import {
  createIntake,
  getMenuDetail,
  resolveMenuImageUrl,
  type MenuDetail,
  type MenuItem,
} from "../../api/menuApi";
import "./RecordMenuDetailPage.css";

type RouteState = {
  brand?: string;
  menu?: MenuItem;
};

function RecordMenuDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { brand: brandParam, menuId: menuIdParam } = useParams<{
    brand: string;
    menuId: string;
  }>();

  const state = location.state as RouteState | null;
  const brand = state?.brand || decodeUrlValue(brandParam || "");
  const menuId = Number(menuIdParam);
  const isValidMenuId = Number.isFinite(menuId) && menuId > 0;

  const initialTime = useMemo(() => getNowTime(), []);
  const initialMenu = (state?.menu as MenuDetail) || null;
  const menuRef = useRef<MenuDetail | null>(initialMenu);
  const detailRequestSeq = useRef(0);

  const [menu, setMenu] = useState<MenuDetail | null>(initialMenu);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(!initialMenu);
  const [saving, setSaving] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const intakeAt = useMemo(() => buildLocalDateTime(hour, minute), [hour, minute]);

  useEffect(() => {
    menuRef.current = menu;
  }, [menu]);

  useEffect(() => {
    const loadFavorite = async () => {
      if (!isValidMenuId) {
        return;
      }

      try {
        const favorites = await getFavorites();
        setIsFavorite(favorites.some((favorite) => Number(favorite.menuId) === menuId));
      } catch {
        const detailFavorite = getBooleanValue(menuRef.current, ["isFavorite", "favorite", "favorited"]);

        if (detailFavorite !== undefined) {
          setIsFavorite(detailFavorite);
        }
      }
    };

    loadFavorite();
  }, [isValidMenuId, menuId]);

  useEffect(() => {
    const loadMenuDetail = async () => {
      if (!isValidMenuId) {
        setErrorMessage("메뉴 정보가 올바르지 않아요.");
        setLoading(false);
        return;
      }

      if (hour.length !== 2 || minute.length !== 2) {
        return;
      }

      const requestSeq = detailRequestSeq.current + 1;
      detailRequestSeq.current = requestSeq;

      try {
        if (!menuRef.current) {
          setLoading(true);
        }

        setErrorMessage("");

        const data = await getMenuDetail(menuId, {
          intakeAt,
          quantity,
        });

        if (detailRequestSeq.current !== requestSeq) {
          return;
        }

        menuRef.current = data;
        setMenu(data);

        const detailFavorite = getBooleanValue(data, ["isFavorite", "favorite", "favorited"]);

        if (detailFavorite !== undefined) {
          setIsFavorite(detailFavorite);
        }
      } catch (error) {
        if (detailRequestSeq.current !== requestSeq) {
          return;
        }

        if (!menuRef.current) {
          setErrorMessage("메뉴 상세 정보를 불러오지 못했어요.");
        } else {
          setErrorMessage(error instanceof Error ? error.message : "카페인 정보를 다시 계산하지 못했어요.");
        }
      } finally {
        if (detailRequestSeq.current === requestSeq) {
          setLoading(false);
        }
      }
    };

    loadMenuDetail();
  }, [isValidMenuId, menuId, intakeAt, hour, minute, quantity]);

  const caffeineMg = getNumberValue(menu, ["caffeineMg"]) ?? 0;

  const intakeCaffeine =
    getNumberValue(menu, ["intakeCaffeine", "intakeCaffeineMg", "selectedCaffeineMg"]) ??
    caffeineMg * quantity;

  const todayTotalCaffeine =
    getNumberValue(menu, [
      "todayTotalCaffeine",
      "todayTotalCaffeineMg",
      "todayCaffeineMg",
      "currentTotalCaffeineMg",
      "totalCaffeineMg",
    ]) ?? 0;

  const expectedTotalCaffeine = Math.max(
    0,
    getNumberValue(menu, ["expectedTotalCaffeine", "expectedTotalCaffeineMg"]) ??
      todayTotalCaffeine + intakeCaffeine
  );

  const dailyLimit =
    getNumberValue(menu, [
      "dailyRecommendedLimit",
      "dailyLimitMg",
      "dailyRecommendedCaffeineMg",
      "recommendedCaffeineMg",
      "recommendedDailyCaffeineMg",
      "maxCaffeineMg",
    ]) ?? 400;

  const progressRate = dailyLimit > 0 ? Math.min(expectedTotalCaffeine / dailyLimit, 1) : 0;
  const risk = getRiskInfo(menu, progressRate);
  const menuImageUrl = menu ? resolveMenuImageUrl(menu.imageUrl || menu.menuImageUrl) : undefined;

  const analysisMessage =
    getStringValue(menu, ["guideMessage", "analysisMessage", "riskMessage", "description", "message"]) ||
    `💡 이 음료의 카페인은 약 ${caffeineMg}mg이에요. 늦은 시간에 마셨다면 오늘 수면에 영향을 줄 수 있어요.`;

  const handleHourChange = (value: string) => {
    setHour(value.replace(/\D/g, "").slice(0, 2));
  };

  const handleMinuteChange = (value: string) => {
    setMinute(value.replace(/\D/g, "").slice(0, 2));
  };

  const handleFavoriteToggle = async () => {
    if (!isValidMenuId || favoriteLoading) {
      return;
    }

    const nextFavorite = !isFavorite;

    try {
      setFavoriteLoading(true);
      setErrorMessage("");
      setIsFavorite(nextFavorite);

      if (nextFavorite) {
        await addFavorite(menuId);
      } else {
        await deleteFavorite(menuId);
      }
    } catch (error) {
      setIsFavorite(!nextFavorite);
      setErrorMessage(error instanceof Error ? error.message : "즐겨찾기 변경에 실패했어요.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!menu || !isValidMenuId || saving) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await createIntake({
        menuId,
        intakeAt: buildLocalDateTime(hour, minute),
        quantity,
      });

      navigate("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "기록 저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout
      className="record-detail-layout"
      contentClassName="record-detail-page"
      headerVariant="sub"
      title="메뉴 상세"
      showBack
      showFavorite
      onBack={() => navigate(-1)}
      onFavoriteClick={() => navigate("/favorites")}
    >
      {loading && <p className="record-detail-page__message">메뉴 정보를 불러오는 중이에요.</p>}

      {!loading && errorMessage && !menu && (
        <p className="record-detail-page__message record-detail-page__message--error">
          {errorMessage}
        </p>
      )}

      {!loading && menu && (
        <>
          <section className="record-detail-menu-card">
            <span className="record-detail-menu-card__image-wrap">
              {menuImageUrl ? (
                <img src={menuImageUrl} alt="" className="record-detail-menu-card__image" />
              ) : (
                <span className="record-detail-menu-card__fallback">{getMenuEmoji(menu)}</span>
              )}
            </span>

            <span className="record-detail-menu-card__content">
              <strong>{menu.menuName}</strong>
              <span>{brand || menu.brand}</span>
            </span>
          </section>

          <section className="record-detail-info-card">
            <div className="record-detail-info-card__top">
              <span className="record-detail-info-card__label">CAFFEINE INFO</span>
            </div>

            <div className="record-detail-info-card__amount-row">
              <div className="record-detail-info-card__amount">
                <strong>{caffeineMg}</strong>
                <span>mg</span>
              </div>

              <div className="record-detail-info-card__actions">
                <span
                  className={`record-detail-info-card__badge record-detail-info-card__badge--${risk.type}`}
                >
                  {risk.label}
                </span>

                <button
                  type="button"
                  className={`record-detail-info-card__favorite-button${
                    isFavorite ? " record-detail-info-card__favorite-button--active" : ""
                  }`}
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                >
                  {isFavorite ? "♥" : "♡"}
                </button>
              </div>
            </div>

            <div
              className={`record-detail-info-card__progress record-detail-info-card__progress--${risk.type}`}
            >
              <span style={{ width: `${progressRate * 100}%` }} />
            </div>

            <div className="record-detail-info-card__summary">
              <strong>예상 총 섭취량</strong>
              <span>
                {Math.round(expectedTotalCaffeine)}mg / {dailyLimit}mg
              </span>
            </div>

            <p className="record-detail-info-card__guide">{analysisMessage}</p>
          </section>

          <section className="record-detail-input-card">
            <h2>섭취 시간 · 수량</h2>

            <div className="record-detail-input-card__time">
              <input
                value={hour}
                onChange={(event) => handleHourChange(event.target.value)}
                onBlur={() => setHour(normalizeTimeValue(hour, 23))}
                inputMode="numeric"
                aria-label="섭취 시간"
              />
              <span>:</span>
              <input
                value={minute}
                onChange={(event) => handleMinuteChange(event.target.value)}
                onBlur={() => setMinute(normalizeTimeValue(minute, 59))}
                inputMode="numeric"
                aria-label="섭취 분"
              />
            </div>

            <div className="record-detail-input-card__quantity-row">
              <span>수량</span>

              <div className="record-detail-input-card__quantity-control">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  aria-label="수량 감소"
                >
                  −
                </button>
                <strong>{quantity}</strong>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
                  aria-label="수량 증가"
                >
                  +
                </button>
              </div>
            </div>
          </section>

          {errorMessage && (
            <p className="record-detail-page__message record-detail-page__message--error">
              {errorMessage}
            </p>
          )}

          <div className="record-detail-page__submit-area">
            <button
              type="button"
              className="record-detail-page__submit-button"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "기록 추가 중" : "기록에 추가하기"}
            </button>
          </div>
        </>
      )}
    </PageLayout>
  );
}

function decodeUrlValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getNowTime() {
  const now = new Date();

  return {
    hour: String(now.getHours()).padStart(2, "0"),
    minute: String(now.getMinutes()).padStart(2, "0"),
  };
}

function normalizeTimeValue(value: string, max: number) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "00";
  }

  return String(Math.min(Math.max(numberValue, 0), max)).padStart(2, "0");
}

function buildLocalDateTime(hour: string, minute: string) {
  const now = new Date();
  const normalizedHour = normalizeTimeValue(hour, 23);
  const normalizedMinute = normalizeTimeValue(minute, 59);

  now.setHours(Number(normalizedHour));
  now.setMinutes(Number(normalizedMinute));
  now.setSeconds(0);
  now.setMilliseconds(0);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}T${normalizedHour}:${normalizedMinute}:00`;
}

function getNumberValue(source: MenuDetail | null, keys: string[]) {
  if (!source) {
    return undefined;
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function getStringValue(source: MenuDetail | null, keys: string[]) {
  if (!source) {
    return "";
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function getBooleanValue(source: MenuDetail | null, keys: string[]) {
  if (!source) {
    return undefined;
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (normalized === "true") {
        return true;
      }

      if (normalized === "false") {
        return false;
      }
    }
  }

  return undefined;
}

function getRiskInfo(menu: MenuDetail | null, progressRate: number) {
  const riskText = getStringValue(menu, ["riskLevel", "riskType", "status", "riskLabel"]).toLowerCase();
  const riskLabel = getStringValue(menu, ["riskLabel"]);

  if (
    riskText.includes("danger") ||
    riskText.includes("high") ||
    riskText.includes("위험") ||
    riskText.includes("dangerous")
  ) {
    return { label: formatRiskLabel(riskLabel, "danger"), type: "danger" };
  }

  if (
    riskText.includes("warning") ||
    riskText.includes("caution") ||
    riskText.includes("middle") ||
    riskText.includes("mid") ||
    riskText.includes("주의")
  ) {
    return { label: formatRiskLabel(riskLabel, "warning"), type: "warning" };
  }

  if (
    riskText.includes("safe") ||
    riskText.includes("low") ||
    riskText.includes("normal") ||
    riskText.includes("안전") ||
    riskText.includes("보통")
  ) {
    return { label: formatRiskLabel(riskLabel, "safe"), type: "safe" };
  }

  if (progressRate >= 0.8) {
    return { label: formatRiskLabel(riskLabel, "danger"), type: "danger" };
  }

  if (progressRate >= 0.55) {
    return { label: formatRiskLabel(riskLabel, "warning"), type: "warning" };
  }

  return { label: formatRiskLabel(riskLabel, "safe"), type: "safe" };
}

function formatRiskLabel(label: string, type: "safe" | "warning" | "danger") {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    if (type === "danger") {
      return "🚨 위험";
    }

    if (type === "warning") {
      return "⚠️ 주의";
    }

    return "✅ 안전";
  }

  if (trimmedLabel.includes("✅") || trimmedLabel.includes("⚠️") || trimmedLabel.includes("🚨")) {
    return trimmedLabel;
  }

  if (type === "danger") {
    return `🚨 ${trimmedLabel}`;
  }

  if (type === "warning") {
    return `⚠️ ${trimmedLabel}`;
  }

  return `✅ ${trimmedLabel}`;
}

function getMenuEmoji(menu: MenuDetail) {
  const text = `${menu.menuName || ""} ${menu.categoryName || ""}`.toLowerCase();

  if (text.includes("콜드") || text.includes("아이스") || text.includes("블루")) {
    return "🧊";
  }

  if (text.includes("말차") || text.includes("티") || text.includes("차")) {
    return "🍵";
  }

  if (text.includes("모카") || text.includes("초코") || text.includes("초콜릿")) {
    return "🍫";
  }

  if (text.includes("라떼") || text.includes("밀크")) {
    return "🥛";
  }

  if (text.includes("디저트") || text.includes("케이크") || text.includes("빵")) {
    return "🍰";
  }

  if (text.includes("에너지") || text.includes("몬스터")) {
    return "⚡";
  }

  if (text.includes("탄산") || text.includes("콜라")) {
    return "🥤";
  }

  return "☕";
}

export default RecordMenuDetailPage;