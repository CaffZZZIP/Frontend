import { useEffect, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRoutineForEdit,
  patchRoutineForEdit,
  type CaffeineSensitivity,
  type IntakeFrequency,
} from "../../api/routineEditApi";
import "./RoutineEditPage.css";

type RoutineKey = "weekday" | "weekend";

const sensitivityOptions: {
  label: string;
  value: CaffeineSensitivity;
}[] = [
  { label: "낮음", value: "LOW" },
  { label: "보통", value: "NORMAL" },
  { label: "높음", value: "HIGH" },
];

const frequencyOptions: {
  label: string;
  value: IntakeFrequency;
}[] = [
  { label: "거의 안 마심", value: "RARELY" },
  { label: "가끔", value: "SOMETIMES" },
  { label: "자주", value: "OFTEN" },
  { label: "매일", value: "DAILY" },
];

const sensitivityMessages: Record<CaffeineSensitivity, ReactNode> = {
  LOW: (
    <>
      카페인에 덜 민감한 편이에요.
      <br />
      늦은 시간만 조심하면 괜찮아요.
    </>
  ),
  NORMAL: (
    <>
      보통 수준의 민감도예요.
      <br />
      오후 늦은 카페인은 조심해주세요.
    </>
  ),
  HIGH: (
    <>
      카페인에 민감한 편이에요.
      <br />
      적은 양도 수면에 영향을 줄 수 있어요.
    </>
  ),
};

const frequencyMessages: Record<IntakeFrequency, ReactNode> = {
  RARELY: <>평소 카페인을 거의 마시지 않는 편이에요.</>,
  SOMETIMES: <>가끔 필요한 날에만 마시는 편이에요.</>,
  OFTEN: <>하루에 1-2잔 정도 마시는 편이에요.</>,
  DAILY: <>거의 매일 카페인을 섭취하는 편이에요.</>,
};

function RoutineEditPage() {
  const navigate = useNavigate();

  const [weekdayRoutineName, setWeekdayRoutineName] = useState("수업");
  const [weekendRoutineName, setWeekendRoutineName] = useState("공강");
  const [weekdayWakeTime, setWeekdayWakeTime] = useState("08:00");
  const [weekdaySleepTime, setWeekdaySleepTime] = useState("01:00");
  const [weekendWakeTime, setWeekendWakeTime] = useState("10:00");
  const [weekendSleepTime, setWeekendSleepTime] = useState("02:00");
  const [caffeineSensitivity, setCaffeineSensitivity] =
    useState<CaffeineSensitivity>("NORMAL");
  const [intakeFrequency, setIntakeFrequency] =
    useState<IntakeFrequency>("OFTEN");
  const [editingRoutineKey, setEditingRoutineKey] =
    useState<RoutineKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const data = await getRoutineForEdit();

        setWeekdayRoutineName(data.weekdayRoutineName || "수업");
        setWeekendRoutineName(data.weekendRoutineName || "공강");
        setWeekdayWakeTime(data.weekdayWakeTime || "08:00");
        setWeekdaySleepTime(data.weekdaySleepTime || "01:00");
        setWeekendWakeTime(data.weekendWakeTime || "10:00");
        setWeekendSleepTime(data.weekendSleepTime || "02:00");
        setCaffeineSensitivity(
          data.caffeineSensitivity || data.sensitivity || "NORMAL"
        );
        setIntakeFrequency(data.intakeFrequency || "OFTEN");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "루틴 정보를 불러오지 못했어요."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutine();
  }, []);

  const handleRoutineNameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  const handleSubmit = async () => {
    const finalWeekdayRoutineName = weekdayRoutineName.trim() || "수업";
    const finalWeekendRoutineName = weekendRoutineName.trim() || "공강";

    try {
      setIsSubmitting(true);

      await patchRoutineForEdit({
        weekdayRoutineName: finalWeekdayRoutineName,
        weekendRoutineName: finalWeekendRoutineName,
        weekdayWakeTime,
        weekdaySleepTime,
        weekendWakeTime,
        weekendSleepTime,
        caffeineSensitivity,
        intakeFrequency,
      });

      navigate("/my", { replace: true });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "루틴 수정에 실패했어요. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="routine-edit-page">
        <section className="routine-edit-title-section">
          <h1>루틴 정보를 불러오는 중이에요</h1>
          <p>잠시만 기다려주세요</p>
        </section>
      </main>
    );
  }

  return (
    <main className="routine-edit-page">
      <button
        type="button"
        className="routine-edit-back-button"
        onClick={() => navigate(-1)}
      >
        ‹
      </button>

      <section className="routine-edit-title-section">
        <h1>나의 카페인 루틴을 수정해주세요</h1>
        <p>수정된 정보로 카페인 분석이 다시 적용돼요</p>
      </section>

      <section className="routine-edit-card">
        <SectionTitle title="카페인 민감도" />

        <div className="routine-edit-option-row routine-edit-option-row--three">
          {sensitivityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                caffeineSensitivity === option.value
                  ? "routine-edit-option-button routine-edit-option-button--active"
                  : "routine-edit-option-button"
              }
              onClick={() => setCaffeineSensitivity(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <InfoBox
          icon="💡"
          text={sensitivityMessages[caffeineSensitivity]}
          small={caffeineSensitivity === "HIGH"}
        />
      </section>

      <section className="routine-edit-card">
        <SectionTitle title="평소 카페인 섭취 빈도" />

        <div className="routine-edit-option-row routine-edit-option-row--four">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                intakeFrequency === option.value
                  ? "routine-edit-option-button routine-edit-option-button--active"
                  : "routine-edit-option-button"
              }
              onClick={() => setIntakeFrequency(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <InfoBox icon="☕" text={frequencyMessages[intakeFrequency]} />
      </section>

      <RoutineCard
        routineKey="weekday"
        title={weekdayRoutineName}
        defaultTitle="수업"
        wakeTime={weekdayWakeTime}
        sleepTime={weekdaySleepTime}
        isEditing={editingRoutineKey === "weekday"}
        onTitleChange={setWeekdayRoutineName}
        onEditStart={() => setEditingRoutineKey("weekday")}
        onEditEnd={() => setEditingRoutineKey(null)}
        onTitleKeyDown={handleRoutineNameKeyDown}
        onWakeTimeChange={setWeekdayWakeTime}
        onSleepTimeChange={setWeekdaySleepTime}
      />

      <RoutineCard
        routineKey="weekend"
        title={weekendRoutineName}
        defaultTitle="공강"
        wakeTime={weekendWakeTime}
        sleepTime={weekendSleepTime}
        isEditing={editingRoutineKey === "weekend"}
        onTitleChange={setWeekendRoutineName}
        onEditStart={() => setEditingRoutineKey("weekend")}
        onEditEnd={() => setEditingRoutineKey(null)}
        onTitleKeyDown={handleRoutineNameKeyDown}
        onWakeTimeChange={setWeekendWakeTime}
        onSleepTimeChange={setWeekendSleepTime}
      />

      <button
        type="button"
        className="routine-edit-submit-button"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "수정 중..." : "수정 완료"}
      </button>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="routine-edit-section-title">
      <span className="routine-edit-section-title__bar" />
      {title}
    </h2>
  );
}

function InfoBox({
  icon,
  text,
  small = false,
}: {
  icon: string;
  text: ReactNode;
  small?: boolean;
}) {
  return (
    <div
      className={
        small
          ? "routine-edit-info-box routine-edit-info-box--small"
          : "routine-edit-info-box"
      }
    >
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function RoutineCard({
  title,
  defaultTitle,
  wakeTime,
  sleepTime,
  isEditing,
  onTitleChange,
  onEditStart,
  onEditEnd,
  onTitleKeyDown,
  onWakeTimeChange,
  onSleepTimeChange,
}: {
  routineKey: RoutineKey;
  title: string;
  defaultTitle: string;
  wakeTime: string;
  sleepTime: string;
  isEditing: boolean;
  onTitleChange: (value: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onWakeTimeChange: (value: string) => void;
  onSleepTimeChange: (value: string) => void;
}) {
  const displayTitle = title.trim() || defaultTitle;

  return (
    <section className="routine-edit-card routine-edit-card--routine">
      <div className="routine-edit-routine-header">
        <h2 className="routine-edit-section-title routine-edit-routine-title">
          <span className="routine-edit-section-title__bar" />

          {isEditing ? (
            <input
              className="routine-edit-name-input"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              onBlur={onEditEnd}
              onKeyDown={onTitleKeyDown}
              autoFocus
            />
          ) : (
            <span className="routine-edit-routine-title-text">
              {displayTitle} 루틴
            </span>
          )}
        </h2>

        <button
          type="button"
          className="routine-edit-name-button"
          onClick={onEditStart}
        >
          ✎
        </button>
      </div>

      <div className="routine-edit-time-row">
        <TimeBox
          icon="☀️"
          label="기상 시간"
          value={wakeTime}
          onChange={onWakeTimeChange}
        />

        <TimeBox
          icon="🌙"
          label="취침 시간"
          value={sleepTime}
          onChange={onSleepTimeChange}
        />
      </div>
    </section>
  );
}

function TimeBox({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="routine-edit-time-box-wrap">
      <p className="routine-edit-time-label">
        <span>{icon}</span>
        {label}
      </p>

      <input
        className="routine-edit-time-input"
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default RoutineEditPage;