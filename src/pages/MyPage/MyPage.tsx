import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import {
  getMyRoutine,
  getWeeklyStats,
  logout,
  withdrawUser,
  type RoutineResponse,
  type WeeklyStatistic,
  type WeeklyStatsResponse,
} from "../../api/myPageApi";
import "./MyPage.css";

type WeekDayInfo = {
  key: string;
  label: string;
  dateLabel: string;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const DEFAULT_STATS: WeeklyStatistic[] = [
  { dayOfWeek: "MONDAY", totalCaffeine: 0, riskLevel: "SAFE" },
  { dayOfWeek: "TUESDAY", totalCaffeine: 0, riskLevel: "SAFE" },
  { dayOfWeek: "WEDNESDAY", totalCaffeine: 0, riskLevel: "SAFE" },
  { dayOfWeek: "THURSDAY", totalCaffeine: 0, riskLevel: "SAFE" },
  { dayOfWeek: "FRIDAY", totalCaffeine: 0, riskLevel: "SAFE" },
  { dayOfWeek: "SATURDAY", totalCaffeine: 0, riskLevel: "SAFE" },
  { dayOfWeek: "SUNDAY", totalCaffeine: 0, riskLevel: "SAFE" },
];

function MyPage() {
  const navigate = useNavigate();

  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const stats = weeklyStats?.weeklyStatistics?.length
    ? weeklyStats.weeklyStatistics
    : DEFAULT_STATS;

  const nickname = routine?.nickname || weeklyStats?.nickname || "사용자";
  const sensitivity = routine?.sensitivity || weeklyStats?.sensitivity || "";
  const routineName = routine?.weekdayRoutineName || weeklyStats?.routineType || "평소 루틴";
  const maxCaffeine = Math.max(...stats.map((item) => item.totalCaffeine), 100);
  const avatarEmoji = getUserEmoji(nickname);

  useEffect(() => {
    const fetchMyPageData = async () => {
      try {
        const [routineData, weeklyStatsData] = await Promise.all([
          getMyRoutine(),
          getWeeklyStats(),
        ]);

        setRoutine(routineData);
        setWeeklyStats(weeklyStatsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPageData();
  }, []);

  const handleRoutineEditClick = () => {
    navigate("/routine-edit", {
      state: {
        mode: "edit",
      },
    });
  };

  const clearAuthStorage = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("nickname");
    localStorage.removeItem("isFirstLogin");

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("oauth2SignupToken");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("nickname");
    sessionStorage.removeItem("isFirstLogin");
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    } finally {
      clearAuthStorage();
      navigate("/", { replace: true });
    }
  };

  const handleWithdrawClick = async () => {
    const confirmed = window.confirm(
      "회원 탈퇴 시 사용자 정보, 루틴 정보, 섭취 기록, 즐겨찾기가 삭제될 수 있어요. 정말 탈퇴할까요?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await withdrawUser();
      clearAuthStorage();
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      alert("회원 탈퇴 중 오류가 발생했어요.");
    }
  };

  return (
    <PageLayout
      headerVariant="sub"
      title="마이페이지"
      showBack={false}
      bottomNav
      contentClassName="my-page"
    >
      {loading ? (
        <section className="my-page__loading">마이페이지 정보를 불러오는 중...</section>
      ) : (
        <>
          <section className="my-profile-card">
            <div className="my-profile-card__emoji-wrap">
              <span className="my-profile-card__emoji">{avatarEmoji}</span>
            </div>

            <div className="my-profile-card__text">
              <strong className="my-profile-card__name">{nickname}</strong>
              <p className="my-profile-card__desc">
                카페인 민감도 {formatSensitivity(sensitivity)} · {routineName}
              </p>
            </div>

            <span className="my-profile-card__arrow">›</span>
          </section>

          <section className="my-stat-card">
            <div className="my-stat-card__header">
              <h2>이번 주 카페인 통계</h2>
              <p>월요일-일요일 · 하루 총 섭취량</p>
            </div>

            <div className="my-chart">
              <div className="my-chart__grid">
                <span />
                <span />
                <span />
              </div>

              <div className="my-chart__bars">
                {weekDays.map((day) => {
                  const stat = findStatByDay(stats, day.key);
                  const totalCaffeine = stat?.totalCaffeine || 0;
                  const riskLevel = stat?.riskLevel || "SAFE";
                  const height = Math.max((totalCaffeine / maxCaffeine) * 100, totalCaffeine > 0 ? 14 : 4);

                  return (
                    <div className="my-chart__item" key={day.key}>
                      <div className="my-chart__bar-wrap">
                        <div
                          className={`my-chart__bar my-chart__bar--${getRiskClassName(riskLevel)}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="my-chart__day">{day.dateLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="my-chart__legend">
              <span>
                <i className="my-chart__dot my-chart__dot--safe" />
                안전
              </span>
              <span>
                <i className="my-chart__dot my-chart__dot--caution" />
                주의
              </span>
              <span>
                <i className="my-chart__dot my-chart__dot--danger" />
                위험
              </span>
            </div>
          </section>

          <section className="my-menu-card">
            <button type="button" className="my-menu-item" onClick={handleRoutineEditClick}>
              <span className="my-menu-item__icon my-menu-item__icon--routine">⚙️</span>
              <span className="my-menu-item__text">
                <strong>루틴 설정 변경</strong>
                <em>기상·취침 시간, 민감도 수정</em>
              </span>
              <span className="my-menu-item__arrow">›</span>
            </button>

            <button type="button" className="my-menu-item" onClick={handleLogoutClick}>
              <span className="my-menu-item__icon my-menu-item__icon--logout">🚪</span>
              <span className="my-menu-item__text">
                <strong>로그아웃</strong>
              </span>
              <span className="my-menu-item__arrow">›</span>
            </button>

            <button
              type="button"
              className="my-menu-item my-menu-item--danger"
              onClick={handleWithdrawClick}
            >
              <span className="my-menu-item__icon my-menu-item__icon--withdraw">🗑️</span>
              <span className="my-menu-item__text">
                <strong>회원 탈퇴</strong>
                <em>모든 데이터가 삭제됩니다</em>
              </span>
              <span className="my-menu-item__arrow">›</span>
            </button>
          </section>
        </>
      )}
    </PageLayout>
  );
}

function getCurrentWeekDays(): WeekDayInfo[] {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayDiff);

  const keys = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  return keys.map((key, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const label = DAY_LABELS[date.getDay()];

    return {
      key,
      label,
      dateLabel: `${month}/${day} ${label}`,
    };
  });
}

function findStatByDay(stats: WeeklyStatistic[], dayKey: string) {
  return stats.find((stat) => normalizeDay(stat.dayOfWeek) === dayKey);
}

function normalizeDay(dayOfWeek: string) {
  const value = dayOfWeek.toUpperCase();

  if (value.includes("MON") || value === "월" || value === "월요일") return "MONDAY";
  if (value.includes("TUE") || value === "화" || value === "화요일") return "TUESDAY";
  if (value.includes("WED") || value === "수" || value === "수요일") return "WEDNESDAY";
  if (value.includes("THU") || value === "목" || value === "목요일") return "THURSDAY";
  if (value.includes("FRI") || value === "금" || value === "금요일") return "FRIDAY";
  if (value.includes("SAT") || value === "토" || value === "토요일") return "SATURDAY";
  if (value.includes("SUN") || value === "일" || value === "일요일") return "SUNDAY";

  return value;
}

function getRiskClassName(riskLevel: string) {
  const value = riskLevel.toUpperCase();

  if (value.includes("DANGER") || value.includes("HIGH") || value.includes("위험")) {
    return "danger";
  }

  if (value.includes("CAUTION") || value.includes("MEDIUM") || value.includes("주의")) {
    return "caution";
  }

  return "safe";
}

function formatSensitivity(sensitivity: string) {
  const value = sensitivity.toUpperCase();

  if (value === "LOW") return "낮음";
  if (value === "NORMAL" || value === "MEDIUM") return "보통";
  if (value === "HIGH") return "높음";

  return sensitivity || "보통";
}

function getUserEmoji(nickname: string) {
  const emojis = ["😊", "☕", "🌙", "🍵", "😴", "🧋", "🌿", "✨"];
  const sum = nickname.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return emojis[sum % emojis.length];
}

export default MyPage;