import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import {
  createIntake,
  getMenuDetail,
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

  const initialTime = useMemo(() => getNowTime(), []);
  const [menu, setMenu] = useState<MenuDetail | null>((state?.menu as MenuDetail) || null);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(!state?.menu);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadMenuDetail = async () => {
      if (!menuId) {
        setErrorMessage("메뉴 정보가 올바르지 않아요.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getMenuDetail(menuId);
        setMenu(data);
      } catch {
        if (!state?.menu) {
          setErrorMessage("메뉴 상세 정보를 불러오지 못했어요.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadMenuDetail();
  }, [menuId, state?.menu]);

  const caffeineMg = getNumberValue(menu, ["caffeineMg"]) || 0;
  const dailyLimit = getNumberValue(menu, [
    "dailyLimitMg",
    "dailyRecommendedCaffeineMg",
    "recommendedCaffeineMg",
    "recommendedDailyCaffeineMg",
    "maxCaffeineMg",
  ]) || 400;

  const baseTotalCaffeine = getNumberValue(menu, [
    "todayTotalCaffeineMg",
    "todayCaffeineMg",
    "currentTotalCaffeineMg",
    "totalCaffeineMg",
  ]);

  const totalCaffeine = Math.max(0, (baseTotalCaffeine || caffeineMg) + caffeineMg * (quantity - 1));
  const progressRate = dailyLimit > 0 ? Math.min(totalCaffeine / dailyLimit, 1) : 0;
  const risk = getRiskInfo(menu, progressRate);
  const analysisMessage =
    getStringValue(menu, ["analysisMessage", "riskMessage", "guideMessage", "description", "message"]) ||
    `💡 이 음료의 카페인은 약 ${caffeineMg}mg이에요. 늦은 시간에 마셨다면 오늘 수면에 영향을 줄 수 있어요.`;

  const handleHourChange = (value: string) => {
    setHour(value.replace(/\D/g, "").slice(0, 2));
  };

  const handleMinuteChange = (value: string) => {
    setMinute(value.replace(/\D/g, "").slice(0, 2));
  };

  const handleSubmit = async () => {
    if (!menu || !menuId || saving) {
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
              {menu.imageUrl || menu.menuImageUrl ? (
                <img
                  src={menu.imageUrl || menu.menuImageUrl}
                  alt=""
                  className="record-detail-menu-card__image"
                />
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

              <span className={`record-detail-info-card__badge record-detail-info-card__badge--${risk.type}`}>
                {risk.label}
              </span>
            </div>

            <div className="record-detail-info-card__progress">
              <span style={{ width: `${progressRate * 100}%` }} />
            </div>

            <div className="record-detail-info-card__summary">
              <strong>금일 섭취량</strong>
              <span>
                {Math.round(totalCaffeine)}mg / {dailyLimit}mg
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

function getRiskInfo(menu: MenuDetail | null, progressRate: number) {
  const riskText = getStringValue(menu, ["riskLevel", "riskType", "status"]).toLowerCase();

  if (riskText.includes("danger") || riskText.includes("high") || riskText.includes("위험")) {
    return { label: "🚨 위험", type: "danger" };
  }

  if (riskText.includes("warning") || riskText.includes("middle") || riskText.includes("주의")) {
    return { label: "⚠️ 주의", type: "warning" };
  }

  if (riskText.includes("safe") || riskText.includes("low") || riskText.includes("안전")) {
    return { label: "✅ 안전", type: "safe" };
  }

  if (progressRate >= 0.8) {
    return { label: "🚨 위험", type: "danger" };
  }

  if (progressRate >= 0.55) {
    return { label: "⚠️ 주의", type: "warning" };
  }

  return { label: "✅ 안전", type: "safe" };
}

function getMenuEmoji(menu: MenuDetail) {
  const text = `${menu.menuName} ${menu.categoryName}`.toLowerCase();

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