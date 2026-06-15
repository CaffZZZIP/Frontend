// 홈 페이지
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import {
  getCaffeineSummary,
  getDailyQuote,
  getIntakePreview,
  getMainRoutine,
  selectRoutineMode,
  type CaffeineSummaryResponse,
  type DailyQuoteResponse,
  type IntakePreviewItem,
  type MainRoutineResponse,
  type RoutineType,
} from "../../api/mainApi";
import "./HomePage.css";

const ROUTINE_STORAGE_KEY = "caffzzzip-selected-routine-type";
const ROUTINE_LABELS_STORAGE_KEY = "caffzzzip-routine-labels";
const ROUTINE_DATA_STORAGE_KEY = "caffzzzip-routine-data";

const defaultRoutineNames: Record<RoutineType, string> = {
  WEEKDAY: "평소",
  WEEKEND: "쉬는 날",
};

const defaultRoutine: MainRoutineResponse = {
  routineName: "평소",
  wakeTime: "07:30",
  sleepTime: "23:30",
};

const defaultSummary: CaffeineSummaryResponse = {
  totalCaffeine: 0,
  remainingCaffeine: 0,
  remainingSafeAmount: 400,
  riskLevel: "SAFE",
  sleepImpactLevel: "LOW",
};

const defaultQuote: DailyQuoteResponse = {
  message: "오늘의 카페인 섭취 기록을 추가하면 수면 영향 요약을 확인할 수 있어요.",
};

function HomePage() {
  const navigate = useNavigate();

  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType>(() => getInitialRoutineType());
  const [routineLabels, setRoutineLabels] = useState<Record<RoutineType, string>>(() =>
    getStoredRoutineLabels()
  );
  const [routine, setRoutine] = useState<MainRoutineResponse>(() => getInitialRoutine());
  const [summary, setSummary] = useState<CaffeineSummaryResponse>(defaultSummary);
  const [quote, setQuote] = useState<DailyQuoteResponse>(defaultQuote);
  const [intakes, setIntakes] = useState<IntakePreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRoutineSaving, setIsRoutineSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMainData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const storedRoutine = getStoredRoutineType();
      const openedRoutine = normalizeRoutine(await getMainRoutine(), defaultRoutineNames.WEEKDAY);

      const weekdayRoutine = normalizeRoutine(
        await selectAndLoadRoutine("WEEKDAY"),
        defaultRoutineNames.WEEKDAY
      );

      const weekendRoutine = normalizeRoutine(
        await selectAndLoadRoutine("WEEKEND"),
        defaultRoutineNames.WEEKEND
      );

      const targetRoutine =
        storedRoutine || inferRoutineType(openedRoutine, weekdayRoutine, weekendRoutine) || "WEEKDAY";

      await selectRoutineMode(targetRoutine);

      const [summaryData, quoteData, intakeData] = await Promise.all([
        getCaffeineSummary(),
        getDailyQuote(),
        getIntakePreview(),
      ]);

      const currentRoutine = targetRoutine === "WEEKDAY" ? weekdayRoutine : weekendRoutine;
      const nextRoutineLabels = {
        WEEKDAY: weekdayRoutine.routineName || defaultRoutineNames.WEEKDAY,
        WEEKEND: weekendRoutine.routineName || defaultRoutineNames.WEEKEND,
      };
      const nextRoutineData: Partial<Record<RoutineType, MainRoutineResponse>> = {
        WEEKDAY: weekdayRoutine,
        WEEKEND: weekendRoutine,
      };

      setRoutineLabels(nextRoutineLabels);
      setSelectedRoutine(targetRoutine);
      setRoutine(currentRoutine);
      setSummary(summaryData || defaultSummary);
      setQuote(quoteData || defaultQuote);
      setIntakes(Array.isArray(intakeData) ? intakeData : []);
      setStoredRoutineType(targetRoutine);
      setStoredRoutineLabels(nextRoutineLabels);
      setStoredRoutineDataMap(nextRoutineData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "메인 정보를 불러오지 못했어요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMainData();
  }, [loadMainData]);

  const recommendedCaffeine = useMemo(() => {
    const calculated = summary.totalCaffeine + summary.remainingSafeAmount;
    return calculated > 0 ? calculated : 400;
  }, [summary.remainingSafeAmount, summary.totalCaffeine]);

  const gaugeRatio = useMemo(() => {
    return Math.min(Math.max(summary.totalCaffeine / recommendedCaffeine, 0), 1);
  }, [recommendedCaffeine, summary.totalCaffeine]);

  const gaugePercent = Math.round(gaugeRatio * 100);
  const knob = getGaugeKnob(gaugeRatio);
  const riskInfo = getRiskInfo(summary.riskLevel);

  const activeGaugeStyle = {
    strokeDasharray: `${gaugePercent} 100`,
  } as CSSProperties;

  const handleRoutineClick = async (routineType: RoutineType) => {
    if (routineType === selectedRoutine || isRoutineSaving) {
      return;
    }

    const previousRoutine = selectedRoutine;
    const previousRoutineData = routine;
    const cachedRoutine = getStoredRoutineDataMap()[routineType];

    setSelectedRoutine(routineType);
    setStoredRoutineType(routineType);
    setIsRoutineSaving(true);
    setErrorMessage("");

    if (cachedRoutine) {
      setRoutine(
        normalizeRoutine(cachedRoutine, routineLabels[routineType] || defaultRoutineNames[routineType])
      );
    }

    try {
      await selectRoutineMode(routineType);

      const [routineData, summaryData, quoteData, intakeData] = await Promise.all([
        getMainRoutine(),
        getCaffeineSummary(),
        getDailyQuote(),
        getIntakePreview(),
      ]);

      const normalizedRoutine = normalizeRoutine(
        routineData,
        routineLabels[routineType] || defaultRoutineNames[routineType]
      );
      const nextRoutineLabels = {
        ...routineLabels,
        [routineType]: normalizedRoutine.routineName || routineLabels[routineType],
      };
      const nextRoutineData = {
        ...getStoredRoutineDataMap(),
        [routineType]: normalizedRoutine,
      };

      setRoutine(normalizedRoutine);
      setRoutineLabels(nextRoutineLabels);
      setSummary(summaryData || defaultSummary);
      setQuote(quoteData || defaultQuote);
      setIntakes(Array.isArray(intakeData) ? intakeData : []);
      setStoredRoutineType(routineType);
      setStoredRoutineLabels(nextRoutineLabels);
      setStoredRoutineDataMap(nextRoutineData);
    } catch (error) {
      setSelectedRoutine(previousRoutine);
      setRoutine(previousRoutineData);
      setStoredRoutineType(previousRoutine);
      setErrorMessage(error instanceof Error ? error.message : "루틴 변경에 실패했어요.");
    } finally {
      setIsRoutineSaving(false);
    }
  };

  return (
    <PageLayout
      headerVariant="home"
      bottomNav
      className="home-page"
      contentClassName="home-page__content"
    >
      <section className="home-main">
        {errorMessage && <div className="home-error">{errorMessage}</div>}

        <div className="home-card home-routine">
          <h2 className="home-section-title">오늘의 루틴</h2>

          <div className="home-routine__tabs">
            <button
              type="button"
              className={`home-routine__tab ${
                selectedRoutine === "WEEKDAY" ? "home-routine__tab--active" : ""
              }`}
              onClick={() => void handleRoutineClick("WEEKDAY")}
              disabled={isRoutineSaving}
            >
              <span>☀️</span>
              {routineLabels.WEEKDAY}
            </button>

            <button
              type="button"
              className={`home-routine__tab ${
                selectedRoutine === "WEEKEND" ? "home-routine__tab--active" : ""
              }`}
              onClick={() => void handleRoutineClick("WEEKEND")}
              disabled={isRoutineSaving}
            >
              <span>☁️</span>
              {routineLabels.WEEKEND}
            </button>
          </div>

          <div className="home-routine__time-area">
            <div className="home-routine__time-item">
              <div className="home-routine__time-icon">🌅</div>
              <div>
                <span>기상</span>
                <strong>{formatTime(routine.wakeTime)}</strong>
              </div>
            </div>

            <div className="home-routine__divider" />

            <div className="home-routine__time-item">
              <div className="home-routine__time-icon">🌙</div>
              <div>
                <span>취침</span>
                <strong>{formatTime(routine.sleepTime)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="home-card home-caffeine">
          <h2 className="home-section-title">오늘 총 카페인 섭취량</h2>

          <div className="home-caffeine__gauge-wrap">
            <svg className="home-caffeine__gauge" viewBox="0 0 260 150" aria-hidden="true">
              <path
                className="home-caffeine__gauge-track"
                d="M30 130 A100 100 0 0 1 230 130"
                pathLength="100"
              />
              <path
                className="home-caffeine__gauge-active"
                d="M30 130 A100 100 0 0 1 230 130"
                pathLength="100"
                style={activeGaugeStyle}
              />
              <circle className="home-caffeine__gauge-knob" cx={knob.x} cy={knob.y} r="13" />
              <circle className="home-caffeine__gauge-knob-inner" cx={knob.x} cy={knob.y} r="6" />
            </svg>

            <div className="home-caffeine__center">
              <strong>{formatMg(summary.totalCaffeine, false)}</strong>
              <span>mg</span>
              <b className={`home-caffeine__badge home-caffeine__badge--${riskInfo.type}`}>
                ⚡ {riskInfo.label}
              </b>
            </div>
          </div>

          <div className="home-caffeine__stats">
            <div>
              <span>잔존 카페인</span>
              <strong>{formatMg(summary.remainingCaffeine)}</strong>
            </div>
            <div>
              <span>하루 권장</span>
              <strong>{formatMg(recommendedCaffeine)}</strong>
            </div>
            <div>
              <span>남은 여유</span>
              <strong>{formatMg(summary.remainingSafeAmount)}</strong>
            </div>
          </div>
        </div>

        <div className="home-card home-quote">
          <div className="home-quote__text">
            <strong>✨ 오늘의 한 줄 요약</strong>
            <p>{quote.message}</p>
          </div>
        </div>

        <div className="home-card home-intake">
          <div className="home-intake__header">
            <h2 className="home-section-title">오늘 섭취 목록</h2>
            <button type="button" onClick={() => navigate("/report")}>
              더보기
              <span>›</span>
            </button>
          </div>

          <div className="home-intake__list">
            {intakes.length > 0 ? (
              intakes.slice(0, 2).map((item, index) => (
                <div className="home-intake__item" key={`${item.menuName}-${item.intakeTime}-${index}`}>
                  <div className="home-intake__icon">{getDrinkIcon(item.menuName, item.brand)}</div>

                  <div className="home-intake__info">
                    <strong>{item.menuName}</strong>
                    <span>{formatIntakeMeta(item)}</span>
                  </div>

                  <b>{formatMg(item.caffeineMg)}</b>
                </div>
              ))
            ) : (
              <div className="home-intake__empty">
                {isLoading ? "오늘 섭취 목록을 불러오는 중이에요." : "아직 오늘 기록한 음료가 없어요."}
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

async function selectAndLoadRoutine(routineType: RoutineType) {
  await selectRoutineMode(routineType);
  return getMainRoutine();
}

function normalizeRoutine(data: MainRoutineResponse | null | undefined, fallbackName: string): MainRoutineResponse {
  return {
    routineName: data?.routineName?.trim() || fallbackName,
    wakeTime: data?.wakeTime || defaultRoutine.wakeTime,
    sleepTime: data?.sleepTime || defaultRoutine.sleepTime,
  };
}

function inferRoutineType(
  currentRoutine: MainRoutineResponse,
  weekdayRoutine: MainRoutineResponse,
  weekendRoutine: MainRoutineResponse
): RoutineType | null {
  if (isSameRoutine(currentRoutine, weekdayRoutine)) {
    return "WEEKDAY";
  }

  if (isSameRoutine(currentRoutine, weekendRoutine)) {
    return "WEEKEND";
  }

  return null;
}

function isSameRoutine(first: MainRoutineResponse, second: MainRoutineResponse) {
  return (
    normalizeText(first.routineName) === normalizeText(second.routineName) &&
    normalizeText(first.wakeTime) === normalizeText(second.wakeTime) &&
    normalizeText(first.sleepTime) === normalizeText(second.sleepTime)
  );
}

function normalizeText(value?: string) {
  return (value || "").trim();
}

function getInitialRoutineType(): RoutineType {
  return getStoredRoutineType() || "WEEKDAY";
}

function getInitialRoutine(): MainRoutineResponse {
  const routineType = getInitialRoutineType();
  const labels = getStoredRoutineLabels();
  const routines = getStoredRoutineDataMap();

  return normalizeRoutine(routines[routineType], labels[routineType] || defaultRoutineNames[routineType]);
}

function getStoredRoutineType(): RoutineType | null {
  const value = getStorageItem(ROUTINE_STORAGE_KEY);

  if (value === "WEEKDAY" || value === "WEEKEND") {
    return value;
  }

  return null;
}

function setStoredRoutineType(routineType: RoutineType) {
  setStorageItem(ROUTINE_STORAGE_KEY, routineType);
}

function getStoredRoutineLabels(): Record<RoutineType, string> {
  const parsed = parseStorageJson(ROUTINE_LABELS_STORAGE_KEY);

  if (!parsed || typeof parsed !== "object") {
    return defaultRoutineNames;
  }

  const labels = parsed as Partial<Record<RoutineType, unknown>>;

  return {
    WEEKDAY:
      typeof labels.WEEKDAY === "string" && labels.WEEKDAY.trim()
        ? labels.WEEKDAY.trim()
        : defaultRoutineNames.WEEKDAY,
    WEEKEND:
      typeof labels.WEEKEND === "string" && labels.WEEKEND.trim()
        ? labels.WEEKEND.trim()
        : defaultRoutineNames.WEEKEND,
  };
}

function setStoredRoutineLabels(labels: Record<RoutineType, string>) {
  setStorageItem(ROUTINE_LABELS_STORAGE_KEY, JSON.stringify(labels));
}

function getStoredRoutineDataMap(): Partial<Record<RoutineType, MainRoutineResponse>> {
  const parsed = parseStorageJson(ROUTINE_DATA_STORAGE_KEY);

  if (!parsed || typeof parsed !== "object") {
    return {};
  }

  const data = parsed as Partial<Record<RoutineType, unknown>>;
  const weekdayRoutine = toStoredRoutine(data.WEEKDAY);
  const weekendRoutine = toStoredRoutine(data.WEEKEND);
  const result: Partial<Record<RoutineType, MainRoutineResponse>> = {};

  if (weekdayRoutine) {
    result.WEEKDAY = weekdayRoutine;
  }

  if (weekendRoutine) {
    result.WEEKEND = weekendRoutine;
  }

  return result;
}

function setStoredRoutineDataMap(data: Partial<Record<RoutineType, MainRoutineResponse>>) {
  setStorageItem(ROUTINE_DATA_STORAGE_KEY, JSON.stringify(data));
}

function toStoredRoutine(value: unknown): MainRoutineResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const routineValue = value as Partial<Record<keyof MainRoutineResponse, unknown>>;

  if (
    typeof routineValue.routineName !== "string" ||
    typeof routineValue.wakeTime !== "string" ||
    typeof routineValue.sleepTime !== "string"
  ) {
    return null;
  }

  return {
    routineName: routineValue.routineName,
    wakeTime: routineValue.wakeTime,
    sleepTime: routineValue.sleepTime,
  };
}

function parseStorageJson(key: string) {
  const value = getStorageItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function getStorageItem(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function formatTime(value?: string) {
  const time = extractTimeParts(value);

  if (!time) {
    return "--:--";
  }

  return `${time.hour}:${time.minute}`;
}

function formatIntakeMeta(item: IntakePreviewItem) {
  const time = formatIntakeTime(item.intakeTime);
  const quantity = Number(item.quantity || 0);
  const parts = [time, item.brand, quantity > 0 ? `${quantity}잔` : ""].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "기록 정보 없음";
}

function formatIntakeTime(value?: string) {
  const time = extractTimeParts(value);

  if (!time) {
    return "";
  }

  return `${time.hour}:${time.minute}`;
}

function extractTimeParts(value?: string) {
  if (!value) {
    return null;
  }

  const timeMatch = value.match(/(\d{1,2}):(\d{2})/);

  if (timeMatch) {
    return {
      hour: timeMatch[1].padStart(2, "0"),
      minute: timeMatch[2],
    };
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return {
      hour: String(date.getHours()).padStart(2, "0"),
      minute: String(date.getMinutes()).padStart(2, "0"),
    };
  }

  return null;
}

function formatMg(value: number, withUnit = true) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return withUnit ? `${safeValue}mg` : `${safeValue}`;
}

function getGaugeKnob(ratio: number) {
  const safeRatio = Math.min(Math.max(ratio, 0), 1);
  const angle = Math.PI * (1 - safeRatio);
  const radius = 100;
  const centerX = 130;
  const centerY = 130;

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY - radius * Math.sin(angle),
  };
}

function getRiskInfo(level?: string) {
  const value = (level || "").toUpperCase();

  if (["SAFE", "LOW", "NORMAL", "GOOD", "STABLE"].includes(value)) {
    return { label: "안정 단계", type: "safe" };
  }

  if (["DANGER", "HIGH", "RISK", "SEVERE"].includes(value)) {
    return { label: "위험 단계", type: "danger" };
  }

  return { label: "주의 단계", type: "caution" };
}

function getDrinkIcon(menuName: string, brand: string) {
  const text = `${menuName} ${brand}`.toLowerCase();

if (text.includes("콜드브루")) {
    return "☕";
  }

  if (text.includes("빙수")) {
    return "🍧";
  }

  if (text.includes("버블") || text.includes("펄")) {
    return "🧋";
  }

  if (text.includes("아이스티") || text.includes("에이드") || text.includes("주스") || text.includes("스무디") || text.includes("블렌디드")) {
    return "🍹";
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

  if (text.includes("크루아상")) {
    return "🥐";
  }

  if (text.includes("샌드위치")) {
      return "🥪";
    }

  if (text.includes("베이글")) {
    return "🥯";
  }

  if (text.includes("쿠키")) {
      return "🍪";
  }

  if (text.includes("머핀")) {
    return "🧁";
  }

  if (text.includes("디저트") || text.includes("케이크") || text.includes("빵")) {
    return "🍰";
  }

  if (text.includes("에너지") || text.includes("몬스터")) {
    return "⚡";
  }

  if (text.includes("탄산") || text.includes("콜라") || text.includes("사이다") || text.includes("소다")) {
    return "🥤";
  }

  if (text.includes("주스")) {
    return "🧃";
  }

  if (text.includes("스무디") || text.includes("쉐이크")) {
    return "🍹";
  }

  if (text.includes("아이스")) {
    return "🧊";
  }


  return "☕";
}

export default HomePage;