// 온보딩 페이지 ~ 루틴 입력 및 저장

import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import "./OnboardingPage.css";
import { saveRoutine } from "../../api/routineApi";
import type {
  CaffeineSensitivity,
  IntakeFrequency,
} from "../../api/routineApi";

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
  { label: "적게 마심", value: "SOMETIMES" },
  { label: "자주", value: "OFTEN" },
  { label: "매우 자주", value: "DAILY" },
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
      커피 1잔은 괜찮지만 2잔 이상이거나
      <br />
      늦게 마시면 수면에 영향이 있어요.
    </>
  ),
  HIGH: (
    <>
      카페인에 예민한 편이에요.
      <br />
      오후 카페인은 수면에 영향이 클 수 있어요.
    </>
  ),
};

const frequencyMessages: Record<IntakeFrequency, ReactNode> = {
  RARELY: <>평소 카페인을 거의 마시지 않아요.</>,
  SOMETIMES: <>필요할 때만 가볍게 마시는 편이에요.</>,
  OFTEN: <>하루 평균 1-2잔 정도 마셔요.</>,
  DAILY: <>하루에 여러 번 자주 마시는 편이에요.</>,
};

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [caffeineSensitivity, setCaffeineSensitivity] =
    useState<CaffeineSensitivity>("NORMAL");
  const [intakeFrequency, setIntakeFrequency] =
    useState<IntakeFrequency>("OFTEN");

  const [weekdayRoutineName, setWeekdayRoutineName] = useState("평소");
  const [weekendRoutineName, setWeekendRoutineName] = useState("쉬는 날");

  const [weekdayWakeTime, setWeekdayWakeTime] = useState("07:30");
  const [weekdaySleepTime, setWeekdaySleepTime] = useState("23:30");
  const [weekendWakeTime, setWeekendWakeTime] = useState("09:00");
  const [weekendSleepTime, setWeekendSleepTime] = useState("01:00");

  const [editingRoutineKey, setEditingRoutineKey] =
    useState<RoutineKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishRoutineEdit = () => {
    setEditingRoutineKey(null);
  };

  const handleRoutineKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  const handleSubmit = async () => {
    const finalWeekdayRoutineName = weekdayRoutineName.trim() || "평소";
    const finalWeekendRoutineName = weekendRoutineName.trim() || "쉬는 날";

    try {
      setIsSubmitting(true);

      await saveRoutine({
        weekdayRoutineName: finalWeekdayRoutineName,
        weekendRoutineName: finalWeekendRoutineName,
        weekdayWakeTime,
        weekdaySleepTime,
        weekendWakeTime,
        weekendSleepTime,
        caffeineSensitivity,
        intakeFrequency,
      });

      navigate("/home", { replace: true });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "설정 저장에 실패했어요. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="onboarding-page">
      <section className="onboarding-title-section">
        <h1>나의 카페인 습관을 알려주세요</h1>
        <p>맞춤 분석을 위한 기본 정보가 필요해요</p>
      </section>

      <section className="onboarding-card">
        <SectionTitle title="카페인 민감도" />

        <div className="option-row option-row--three">
          {sensitivityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                caffeineSensitivity === option.value
                  ? "option-button option-button--active"
                  : "option-button"
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
          className={caffeineSensitivity === "HIGH" ? "info-box--small" : ""}
        />
      </section>

      <section className="onboarding-card">
        <SectionTitle title="평소 카페인 섭취 빈도" />

        <div className="option-row option-row--four">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                intakeFrequency === option.value
                  ? "option-button option-button--active"
                  : "option-button"
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
        name={weekdayRoutineName}
        defaultName="평소"
        wakeTime={weekdayWakeTime}
        sleepTime={weekdaySleepTime}
        isEditing={editingRoutineKey === "weekday"}
        onNameChange={setWeekdayRoutineName}
        onEditClick={() => setEditingRoutineKey("weekday")}
        onEditFinish={finishRoutineEdit}
        onNameKeyDown={handleRoutineKeyDown}
        onWakeTimeChange={setWeekdayWakeTime}
        onSleepTimeChange={setWeekdaySleepTime}
      />

      <RoutineCard
        name={weekendRoutineName}
        defaultName="쉬는 날"
        wakeTime={weekendWakeTime}
        sleepTime={weekendSleepTime}
        isEditing={editingRoutineKey === "weekend"}
        onNameChange={setWeekendRoutineName}
        onEditClick={() => setEditingRoutineKey("weekend")}
        onEditFinish={finishRoutineEdit}
        onNameKeyDown={handleRoutineKeyDown}
        onWakeTimeChange={setWeekendWakeTime}
        onSleepTimeChange={setWeekendSleepTime}
      />

      <button
        type="button"
        className="onboarding-submit-button"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "저장 중..." : "설정 완료"}
      </button>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="section-title">
      <span className="section-title__bar" />
      {title}
    </h2>
  );
}

function InfoBox({
  icon,
  text,
  className = "",
}: {
  icon: string;
  text: ReactNode;
  className?: string;
}) {
  return (
    <div className={["info-box", className].filter(Boolean).join(" ")}>
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function RoutineCard({
  name,
  defaultName,
  wakeTime,
  sleepTime,
  isEditing,
  onNameChange,
  onEditClick,
  onEditFinish,
  onNameKeyDown,
  onWakeTimeChange,
  onSleepTimeChange,
}: {
  name: string;
  defaultName: string;
  wakeTime: string;
  sleepTime: string;
  isEditing: boolean;
  onNameChange: (value: string) => void;
  onEditClick: () => void;
  onEditFinish: () => void;
  onNameKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onWakeTimeChange: (value: string) => void;
  onSleepTimeChange: (value: string) => void;
}) {
  const displayName = name.trim() || defaultName;

  return (
    <section className="onboarding-card onboarding-card--routine">
      <div className="routine-card-header">
        <h2 className="section-title routine-title">
          <span className="section-title__bar" />
          {isEditing ? (
            <input
              className="routine-name-input"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              onBlur={onEditFinish}
              onKeyDown={onNameKeyDown}
              autoFocus
            />
          ) : (
            <span className="routine-title-text">{displayName} 루틴</span>
          )}
        </h2>

        <button
          type="button"
          className="routine-edit-button"
          onClick={onEditClick}
        >
          ✎
        </button>
      </div>

      <div className="routine-time-row">
        <TimeBox
          label="기상 시간"
          icon="☀️"
          time={wakeTime}
          onChange={onWakeTimeChange}
        />

        <TimeBox
          label="취침 시간"
          icon="🌙"
          time={sleepTime}
          onChange={onSleepTimeChange}
        />
      </div>
    </section>
  );
}

function TimeBox({
  label,
  icon,
  time,
  onChange,
}: {
  label: string;
  icon: string;
  time: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="time-box-wrap">
      <p className="time-label">
        <span>{icon}</span>
        {label}
      </p>

      <input
        className="time-box-input"
        type="time"
        value={time}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}