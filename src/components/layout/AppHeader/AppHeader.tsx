import { useNavigate } from "react-router-dom";
import "./AppHeader.css";

export type AppHeaderVariant = "none" | "home" | "sub";

type AppHeaderProps = {
  variant?: AppHeaderVariant;
  title?: string;
  showBack?: boolean;
  showNotification?: boolean;
  showFavorite?: boolean;
  onBack?: () => void;
  onNotificationClick?: () => void;
  onFavoriteClick?: () => void;
  className?: string;
};

function AppHeader({
  variant = "home",
  title,
  showBack,
  showNotification = false,
  showFavorite = false,
  onBack,
  onNotificationClick,
  onFavoriteClick,
  className = "",
}: AppHeaderProps) {
  const navigate = useNavigate();

  if (variant === "none") {
    return null;
  }

  const shouldShowBack = showBack ?? variant === "sub";
  const headerTitle = variant === "home" ? title || "CaffZZZip" : title || "";

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate(-1);
  };

  return (
    <header className={`app-header app-header--${variant} ${className}`}>
      {variant === "home" ? (
        <>
          <h1 className="app-header__brand">{headerTitle}</h1>

          {showNotification ? (
            <button
              type="button"
              className="app-header__icon-button app-header__notification"
              onClick={onNotificationClick}
              aria-label="알림"
            >
              <BellIcon />
            </button>
          ) : (
            <div className="app-header__right-placeholder" />
          )}
        </>
      ) : (
        <>
          <div className="app-header__left">
            {shouldShowBack && (
              <button
                type="button"
                className="app-header__back-button"
                onClick={handleBack}
                aria-label="뒤로가기"
              >
                <BackIcon />
              </button>
            )}

            <h1 className="app-header__title">{headerTitle}</h1>
          </div>

          {showFavorite ? (
            <button
              type="button"
              className="app-header__icon-button app-header__favorite"
              onClick={onFavoriteClick}
              aria-label="즐겨찾기"
            >
              <HeartIcon />
            </button>
          ) : (
            <div className="app-header__right-placeholder" />
          )}
        </>
      )}
    </header>
  );
}

function BackIcon() {
  return (
    <svg width="12" height="22" viewBox="0 0 12 22" fill="none" aria-hidden="true">
      <path
        d="M10.2 2L2 11L10.2 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 9.7C18 6.4 15.9 4 12 4C8.1 4 6 6.4 6 9.7V13.2L4.5 16.2C4.2 16.8 4.6 17.5 5.3 17.5H18.7C19.4 17.5 19.8 16.8 19.5 16.2L18 13.2V9.7Z"
        fill="currentColor"
      />
      <path
        d="M9.7 18.5C10 19.6 10.8 20.3 12 20.3C13.2 20.3 14 19.6 14.3 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="17" height="16" viewBox="0 0 24 22" fill="none" aria-hidden="true">
      <path
        d="M12 20.2C11.7 20.2 11.4 20.1 11.2 19.9C4.2 13.7 2 10.4 2 6.7C2 3.9 4.1 1.8 6.9 1.8C8.5 1.8 10.1 2.6 11.1 3.9C11.3 4.2 11.7 4.2 11.9 3.9C12.9 2.6 14.5 1.8 16.1 1.8C18.9 1.8 21 3.9 21 6.7C21 10.4 18.8 13.7 11.8 19.9C11.6 20.1 11.3 20.2 12 20.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default AppHeader;