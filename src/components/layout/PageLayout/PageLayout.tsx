import type { ReactNode } from "react";
import AppHeader, { type AppHeaderVariant } from "../AppHeader/AppHeader";
import BottomNav, { type BottomNavItem } from "../BottomNav/BottomNav";
import "./PageLayout.css";

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerVariant?: AppHeaderVariant;
  title?: string;
  showBack?: boolean;
  showNotification?: boolean;
  showFavorite?: boolean;
  onBack?: () => void;
  onNotificationClick?: () => void;
  onFavoriteClick?: () => void;
  bottomNav?: boolean;
  bottomNavItems?: BottomNavItem[];
};

function PageLayout({
  children,
  className = "",
  contentClassName = "",
  headerVariant = "none",
  title,
  showBack,
  showNotification = false,
  showFavorite = false,
  onBack,
  onNotificationClick,
  onFavoriteClick,
  bottomNav = false,
  bottomNavItems,
}: PageLayoutProps) {
  const hasHeader = headerVariant !== "none";
  const hasPageChrome = hasHeader || bottomNav;

  if (!hasPageChrome) {
    return <main className={`page-layout ${className}`}>{children}</main>;
  }

  const layoutClassName = [
    "page-layout",
    "page-layout--screen",
    hasHeader ? "page-layout--with-header" : "",
    bottomNav ? "page-layout--with-bottom-nav" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={layoutClassName}>
      {hasHeader && (
        <AppHeader
          variant={headerVariant}
          title={title}
          showBack={showBack}
          showNotification={showNotification}
          showFavorite={showFavorite}
          onBack={onBack}
          onNotificationClick={onNotificationClick}
          onFavoriteClick={onFavoriteClick}
        />
      )}

      <div className={`page-layout__content ${contentClassName}`}>{children}</div>

      {bottomNav && <BottomNav items={bottomNavItems} />}
    </main>
  );
}

export default PageLayout;