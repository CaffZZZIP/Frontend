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

  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType>("WEEKDAY");
  const [routineLabels, setRoutineLabels] = useState<Record<RoutineType, string>>(defaultRoutineNames);
  const [routine, setRoutine] = useState<MainRoutineResponse>(defaultRoutine);
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
      const openedRoutine = normalizeRoutine(await getMainRoutine(), defaultRoutineNames.WEEKDAY);

      const weekdayRoutine = normalizeRoutine(
        await selectAndLoadRoutine("WEEKDAY"),
        defaultRoutineNames.WEEKDAY
      );

      const weekendRoutine = normalizeRoutine(
        await selectAndLoadRoutine("WEEKEND"),
        defaultRoutineNames.WEEKEND
      );

      const storedRoutine = getStoredRoutineType();

      const targetRoutine =
        inferRoutineType(openedRoutine, weekdayRoutine, weekendRoutine) ||
        storedRoutine ||
        "WEEKDAY";

      await selectRoutineMode(targetRoutine);

      const [summaryData, quoteData, intakeData] = await Promise.all([
        getCaffeineSummary(),
        getDailyQuote(),
        getIntakePreview(),
      ]);

      const currentRoutine = targetRoutine === "WEEKDAY" ? weekdayRoutine : weekendRoutine;

      setRoutineLabels({
        WEEKDAY: weekdayRoutine.routineName || defaultRoutineNames.WEEKDAY,
        WEEKEND: weekendRoutine.routineName || defaultRoutineNames.WEEKEND,
      });
      setSelectedRoutine(targetRoutine);
      setRoutine(currentRoutine);
      setSummary(summaryData || defaultSummary);
      setQuote(quoteData || defaultQuote);
      setIntakes(Array.isArray(intakeData) ? intakeData : []);
      setStoredRoutineType(targetRoutine);
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

    setSelectedRoutine(routineType);
    setIsRoutineSaving(true);
    setErrorMessage("");

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

      setRoutine(normalizedRoutine);
      setRoutineLabels((prev) => ({
        ...prev,
        [routineType]: normalizedRoutine.routineName || prev[routineType],
      }));
      setSummary(summaryData || defaultSummary);
      setQuote(quoteData || defaultQuote);
      setIntakes(Array.isArray(intakeData) ? intakeData : []);
      setStoredRoutineType(routineType);
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
                    <span>
                      {formatIntakeTime(item.intakeTime)}
                      {item.brand ? ` · ${item.brand}` : ""}
                    </span>
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

function getStoredRoutineType(): RoutineType | null {
  const value = localStorage.getItem(ROUTINE_STORAGE_KEY);

  if (value === "WEEKDAY" || value === "WEEKEND") {
    return value;
  }

  return null;
}

function setStoredRoutineType(routineType: RoutineType) {
  localStorage.setItem(ROUTINE_STORAGE_KEY, routineType);
}

function formatTime(value?: string) {
  const time = extractTimeParts(value);

  if (!time) {
    return "--:--";
  }

  return `${time.hour}:${time.minute}`;
}

function formatIntakeTime(value?: string) {
  const time = extractTimeParts(value);

  if (!time) {
    return "--:--";
  }

  const hourNumber = Number(time.hour);
  const period = hourNumber < 12 ? "오전" : "오후";
  const displayHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;

  return `${period} ${String(displayHour).padStart(2, "0")}:${time.minute}`;
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

  if (text.includes("tea") || text.includes("티") || text.includes("차")) {
    return "🍵";
  }

  if (text.includes("에너지") || text.includes("energy")) {
    return "⚡";
  }

  if (text.includes("콜라") || text.includes("탄산") || text.includes("soda")) {
    return "🥤";
  }

  if (text.includes("초코") || text.includes("choco")) {
    return "🍫";
  }

  return "☕";
}

export default HomePage;