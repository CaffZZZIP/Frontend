import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./BottomNav.css";

type IconProps = {
  active: boolean;
};

export type BottomNavItem = {
  id: string;
  label: string;
  path: string;
  activePaths?: string[];
  icon?: (props: IconProps) => ReactNode;
};

type BottomNavProps = {
  items?: BottomNavItem[];
  className?: string;
};

const defaultBottomNavItems: BottomNavItem[] = [
  {
    id: "home",
    label: "홈",
    path: "/home",
    activePaths: ["/home"],
    icon: HomeIcon,
  },
  {
    id: "record",
    label: "기록",
    path: "/record/brands",
    activePaths: ["/record", "/records", "/history"],
    icon: ClockIcon,
  },
  {
    id: "report",
    label: "리포트",
    path: "/report",
    activePaths: ["/report", "/reports"],
    icon: ReportIcon,
  },
  {
    id: "my",
    label: "MY",
    path: "/my",
    activePaths: ["/my", "/mypage"],
    icon: UserIcon,
  },
];

function BottomNav({ items = defaultBottomNavItems, className = "" }: BottomNavProps) {
  const { pathname } = useLocation();

  return (
    <nav className={`bottom-nav ${className}`} aria-label="하단 메뉴">
      {items.map((item) => {
        const active = isActivePath(pathname, item);
        const Icon = item.icon || HomeIcon;

        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={`bottom-nav__item ${active ? "bottom-nav__item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon active={active} />
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function isActivePath(pathname: string, item: BottomNavItem) {
  const paths = item.activePaths || [item.path];

  return paths.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function HomeIcon({ active }: IconProps) {
  return (
    <svg className="bottom-nav__icon" width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.6L12 4L20 10.6V20H14.7V14.2H9.3V20H4V10.6Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="bottom-nav__icon" width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.8V12.3L15.2 14.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportIcon({ active }: IconProps) {
  return (
    <svg className="bottom-nav__icon" width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="7"
        width="14"
        height="12"
        rx="2"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M9 7V5.7C9 4.8 9.7 4.2 10.6 4.2H13.4C14.3 4.2 15 4.8 15 5.7V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ active }: IconProps) {
  return (
    <svg className="bottom-nav__icon" width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" />
      <path
        d="M5.5 19.2C6.3 15.8 8.7 14.1 12 14.1C15.3 14.1 17.7 15.8 18.5 19.2"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BottomNav;