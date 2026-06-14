// 즐겨찾기 페이지
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import {
  deleteFavorite,
  getFavorites,
  type FavoriteMenu,
} from "../../api/favoriteApi";
import "./FavoritePage.css";

function FavoritePage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [openedMenuKey, setOpenedMenuKey] = useState<number | null>(null);
  const [deletingMenuId, setDeletingMenuId] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getFavorites();

        if (isMounted) {
          setFavorites(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "즐겨찾기 목록을 불러오지 못했어"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, []);

  const getFavoriteKey = (menu: FavoriteMenu) => {
    return menu.favoriteId || menu.menuId;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0].clientX);
    setTouchStartY(event.touches[0].clientY);
  };

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>,
    menu: FavoriteMenu
  ) => {
    if (touchStartX === null || touchStartY === null) {
      return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    const menuKey = getFavoriteKey(menu);

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        setOpenedMenuKey(menuKey);
      } else {
        setOpenedMenuKey(null);
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleMenuClick = (menu: FavoriteMenu) => {
    const menuKey = getFavoriteKey(menu);

    if (openedMenuKey === menuKey) {
      setOpenedMenuKey(null);
      return;
    }

    navigate(`/record/brands/${encodeURIComponent(menu.brand)}/menus/${menu.menuId}`, {
      state: {
        brand: menu.brand,
        menu,
      },
    });
  };

  const handleDeleteClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    menu: FavoriteMenu
  ) => {
    event.stopPropagation();

    if (deletingMenuId === menu.menuId) {
      return;
    }

    try {
      setDeletingMenuId(menu.menuId);
      setErrorMessage("");

      await deleteFavorite(menu.menuId);

      setFavorites((prevFavorites) =>
        prevFavorites.filter((favorite) => favorite.menuId !== menu.menuId)
      );
      setOpenedMenuKey(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "즐겨찾기 삭제에 실패했어"
      );
    } finally {
      setDeletingMenuId(null);
    }
  };

  return (
    <PageLayout
      className="favorite-layout"
      contentClassName="favorite-page"
      headerVariant="sub"
      title="즐겨찾기"
      showBack
      onBack={() => navigate(-1)}
      bottomNav
    >
      <section className="favorite-page__section">
        <h2 className="favorite-page__section-title">즐겨찾기 메뉴</h2>

        {loading && <p className="favorite-page__message">즐겨찾기 메뉴를 불러오는 중이야</p>}

        {!loading && errorMessage && (
          <p className="favorite-page__message favorite-page__message--error">
            {errorMessage}
          </p>
        )}

        {!loading && !errorMessage && favorites.length === 0 && (
          <p className="favorite-page__message">아직 즐겨찾기한 메뉴가 없어</p>
        )}

        {!loading && !errorMessage && favorites.length > 0 && (
          <div className="favorite-page__list" aria-label="즐겨찾기 메뉴 목록">
            {favorites.map((menu) => {
              const menuKey = getFavoriteKey(menu);
              const isOpened = openedMenuKey === menuKey;
              const isDeleting = deletingMenuId === menu.menuId;

              return (
                <div
                  key={menuKey}
                  className={`favorite-menu-row${isOpened ? " favorite-menu-row--opened" : ""}`}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(event) => handleTouchEnd(event, menu)}
                >
                  <button
                    type="button"
                    className="favorite-menu-row__delete"
                    onClick={(event) => handleDeleteClick(event, menu)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "삭제중" : "삭제"}
                  </button>

                  <button
                    type="button"
                    className="favorite-menu-card"
                    onClick={() => handleMenuClick(menu)}
                  >
                    <span className="favorite-menu-card__image-wrap">
                      {menu.imageUrl || menu.menuImageUrl ? (
                        <img
                          src={menu.imageUrl || menu.menuImageUrl}
                          alt=""
                          className="favorite-menu-card__image"
                        />
                      ) : (
                        <span className="favorite-menu-card__fallback">
                          {getMenuEmoji(menu)}
                        </span>
                      )}
                    </span>

                    <span className="favorite-menu-card__content">
                      <span className="favorite-menu-card__name">{menu.menuName}</span>
                      <span className="favorite-menu-card__category">
                        {menu.brand} · {menu.categoryName}
                      </span>
                    </span>

                    <span className="favorite-menu-card__caffeine">
                      <strong>{menu.caffeineMg}</strong>
                      <span>mg</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}

function getMenuEmoji(menu: FavoriteMenu) {
  const text = `${menu.menuName} ${menu.categoryName}`.toLowerCase();

  if (text.includes("콜드브루")) {
    return "☕";
  }

  if (text.includes("빙수")) {
    return "🍧";
  }

  if (text.includes("버블") || text.includes("펄")) {
    return "🧋";
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

export default FavoritePage;