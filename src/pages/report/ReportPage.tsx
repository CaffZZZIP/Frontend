import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import { getTodayReport, type ReportIntakeItem, type TodayReportResponse } from "../../api/reportApi";
import "./ReportPage.css";

const defaultReport: TodayReportResponse = {
  totalCaffeine: 0,
  remainingCaffeine: 0,
  bedtimeRemainingCaffeine: 0,
  riskLevel: "SAFE",
  recommendedSleepTime: "",
  sleepImpactLevel: "LOW",
  analysisMessage: "오늘의 카페인 섭취 기록을 추가하면 수면 영향 분석을 확인할 수 있어요.",
  intakeList: [],
};

function ReportPage() {
  const [report, setReport] = useState<TodayReportResponse>(defaultReport);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await getTodayReport();
      setReport(data || defaultReport);
    } catch (error) {
      setReport(defaultReport);
      setErrorMessage(error instanceof Error ? error.message : "오늘의 카페인 리포트를 불러오지 못했어요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const riskInfo = useMemo(() => {
    return getRiskInfo(report.riskLevel, report.totalCaffeine);
  }, [report.riskLevel, report.totalCaffeine]);

  const riskStyle = {
    "--report-risk-progress": `${riskInfo.progress}%`,
    "--report-risk-knob": `${riskInfo.knob}%`,
  } as CSSProperties;

  const intakeList = report.intakeList || [];
  const totalCaffeine = report.totalCaffeine || intakeList.reduce((sum, item) => sum + Number(item.caffeineMg || 0), 0);

  return (
    <PageLayout
      headerVariant="sub"
      title="오늘의 카페인 리포트"
      showBack
      bottomNav
      className="report-page"
      contentClassName="report-page__content"
    >
      <section className="report-main">
        {errorMessage && (
          <button type="button" className="report-error" onClick={() => void loadReport()}>
            {errorMessage}
            <span>다시 불러오기</span>
          </button>
        )}

        <div className="report-date-pill">
          <CalendarIcon />
          <span>{formatReportDate(report.reportDate)} · {getRoutineLabel(report.routineName, report.routineType)}</span>
        </div>

        <section className="report-card report-risk">
          <h2 className="report-section-title">하루 권장량 대비 위험도</h2>

          <div className="report-risk__bar" style={riskStyle}>
            <div className={`report-risk__fill report-risk__fill--${riskInfo.type}`} />
            <div className={`report-risk__knob report-risk__knob--${riskInfo.type}`} />
          </div>

          <div className="report-risk__legend">
            <div>
              <span className="report-risk__dot report-risk__dot--safe" />
              안전 
            </div>
            <div>
              <span className="report-risk__dot report-risk__dot--caution" />
              주의
            </div>
            <div>
              <span className="report-risk__dot report-risk__dot--danger" />
              위험
            </div>
          </div>
        </section>

        <section className="report-card report-analysis">
          <div className="report-analysis__title">
            <ChatIcon />
            <h2>수면 영향 분석</h2>
          </div>

          <div className="report-analysis__message">
            <p>{renderAnalysisMessage(report.analysisMessage)}</p>
          </div>

          <div className="report-analysis__stats">
            <div>
              <span>잔존 카페인</span>
              <strong>{formatMg(report.remainingCaffeine)}</strong>
            </div>
            <div>
              <span>안전 취침 가능</span>
              <strong>{formatSleepTime(report.recommendedSleepTime)}</strong>
            </div>
            <div>
              <span>수면 방해 가능성</span>
              <strong>{getSleepImpactLabel(report.sleepImpactLevel)}</strong>
            </div>
          </div>
        </section>

        <section className="report-card report-intake">
          <h2 className="report-section-title">오늘 섭취 목록</h2>

          <div className="report-intake__list">
            {isLoading ? (
              <div className="report-intake__empty">오늘 섭취 목록을 불러오는 중이에요.</div>
            ) : intakeList.length > 0 ? (
              intakeList.map((item, index) => (
                <div className="report-intake__item" key={`${item.menuId}-${item.intakeAt || item.intakeTime || index}`}>
                  <div className="report-intake__icon">{getDrinkIcon(item.menuName, item.brand)}</div>

                  <div className="report-intake__info">
                    <strong>{item.menuName}</strong>
                    <span>{formatIntakeMeta(item)}</span>
                  </div>

                  <b>{formatMg(item.caffeineMg)}</b>
                </div>
              ))
            ) : (
              <div className="report-intake__empty">아직 오늘 기록한 음료가 없어요.</div>
            )}
          </div>

          <div className="report-intake__total">
            <span>합계</span>
            <strong>{formatMg(totalCaffeine)}</strong>
          </div>
        </section>
      </section>
    </PageLayout>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.2" width="17" height="15.3" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M7.5 3.5V7.2M16.5 3.5V7.2M4.2 9.2H19.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12.5H8.1M12 12.5H12.1M16 12.5H16.1M8 16H8.1M12 16H12.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.1 17.8C3.8 16.4 3 14.5 3 12.4C3 7.9 7 4.3 12 4.3C17 4.3 21 7.9 21 12.4C21 16.9 17 20.5 12 20.5C10.8 20.5 9.7 20.3 8.7 19.9L5.2 21.1C4.5 21.3 3.9 20.6 4.2 20L5.1 17.8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M8.2 12.2H8.3M12 12.2H12.1M15.8 12.2H15.9" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
    </svg>
  );
}

function formatReportDate(value?: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return formatDateByParts(new Date());
  }

  return formatDateByParts(date);
}

function formatDateByParts(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}. ${month}. ${day}`;
}

function getRoutineLabel(routineName?: string, routineType?: string) {
  const text = `${routineName || ""} ${routineType || ""}`.toUpperCase();

  if (text.includes("WEEKEND") || text.includes("REST") || text.includes("쉬") || text.includes("휴")) {
    return "쉬는 날 루틴";
  }

  if (text.includes("WEEKDAY") || text.includes("평소")) {
    return "평소 루틴";
  }

  return "평소 루틴";
}

function getRiskInfo(level?: string, totalCaffeine = 0) {
  const value = (level || "").toUpperCase();
  const ratio = Math.min(Math.max(totalCaffeine / 400, 0), 1);
  const progress = Math.round(ratio * 100);
  const knob = Math.min(Math.max(progress, 2), 98);

  if (["DANGER", "HIGH", "RISK", "SEVERE"].includes(value) || totalCaffeine >= 400) {
    return {
      type: "danger",
      progress,
      knob,
    };
  }

  if (["SAFE", "LOW", "NORMAL", "GOOD", "STABLE"].includes(value) && totalCaffeine <= 200) {
    return {
      type: "safe",
      progress,
      knob,
    };
  }

  return {
    type: "caution",
    progress,
    knob,
  };
}

function renderAnalysisMessage(message?: string) {
  const text = message || "오늘의 카페인 섭취 기록을 추가하면 수면 영향 분석을 확인할 수 있어요.";
  const parts = text.split(/(\d+mg|\d{1,2}:\d{2}|오전\s?\d{1,2}시\s?\d{1,2}분|오후\s?\d{1,2}시\s?\d{1,2}분|약\s?\d+시간)/g);

  return parts.map((part, index) => {
    const isHighlight = /(\d+mg|\d{1,2}:\d{2}|오전\s?\d{1,2}시\s?\d{1,2}분|오후\s?\d{1,2}시\s?\d{1,2}분|약\s?\d+시간)/.test(part);

    if (isHighlight) {
      return <strong key={`${part}-${index}`}>{part}</strong>;
    }

    return part;
  });
}

function formatMg(value?: number) {
  const safeValue = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
  return `${safeValue}mg`;
}

function formatSleepTime(value?: string) {
  const time = extractTime(value);

  if (!time) {
    return "--:--";
  }

  return `${time}~`;
}

function formatIntakeMeta(item: ReportIntakeItem) {
  const time = extractTime(item.intakeAt || item.intakeTime);
  const quantity = Number(item.quantity || 0);
  const parts = [
    time,
    item.brand,
    quantity > 1 ? `${quantity}잔` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "기록 정보 없음";
}

function extractTime(value?: string) {
  if (!value) {
    return "";
  }

  const timeMatch = value.match(/(\d{1,2}):(\d{2})/);

  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  return "";
}

function getSleepImpactLabel(level?: string) {
  const value = (level || "").toUpperCase();

  if (["LOW", "SAFE", "GOOD", "낮음"].includes(value)) {
    return "낮음";
  }

  if (["HIGH", "DANGER", "RISK", "높음"].includes(value)) {
    return "높음";
  }

  return "보통";
}

function getDrinkIcon(menuName?: string, brand?: string) {
  const text = `${menuName || ""} ${brand || ""}`.toLowerCase();

  if (text.includes("tea") || text.includes("티") || text.includes("차")) {
    return "🍵";
  }

  if (text.includes("라떼") || text.includes("latte") || text.includes("milk")) {
    return "🥛";
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

export default ReportPage;