// 메뉴 선택 페이지
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import { getMenus, searchMenus, type MenuItem } from "../../api/menuApi";
import "./RecordMenuPage.css";

type RouteState = {
  brand?: string;
};

function RecordMenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { brand: brandParam } = useParams<{ brand: string }>();
  const state = location.state as RouteState | null;

  const brand = useMemo(() => {
    return state?.brand || decodeUrlValue(brandParam || "");
  }, [state?.brand, brandParam]);

  const [allMenus, setAllMenus] = useState<MenuItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadMenus = async () => {
      if (!brand) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getMenus({ brand });

        setAllMenus(data);
        setMenus(data);
        setActiveCategory("전체");
      } catch {
        setErrorMessage("메뉴 목록을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, [brand]);

  useEffect(() => {
    if (!brand || loading) {
      return;
    }

    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      setMenus(allMenus);
      setSearchLoading(false);
      return;
    }

    let ignored = false;

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setErrorMessage("");

        const data = await searchMenus({
          keyword: trimmedKeyword,
          brand,
        });

        if (!ignored) {
          setMenus(data);
        }
      } catch {
        if (!ignored) {
          setErrorMessage("메뉴 검색에 실패했어요.");
        }
      } finally {
        if (!ignored) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      ignored = true;
      window.clearTimeout(timer);
    };
  }, [brand, keyword, allMenus, loading]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(allMenus.map((menu) => menu.categoryName).filter(Boolean))
    );

    return ["전체", ...uniqueCategories];
  }, [allMenus]);

  const filteredMenus = useMemo(() => {
    if (activeCategory === "전체") {
      return menus;
    }

    return menus.filter((menu) => menu.categoryName === activeCategory);
  }, [menus, activeCategory]);

  const handleMenuClick = (menu: MenuItem) => {
    navigate(`/record/brands/${encodeURIComponent(brand)}/menus/${menu.menuId}`, {
      state: {
        brand,
        menu,
      },
    });
  };

  const isLoading = loading || searchLoading;

  return (
    <PageLayout
      className="record-menu-layout"
      contentClassName="record-menu-page"
      headerVariant="sub"
      title={brand}
      showBack
      showFavorite
      onBack={() => navigate("/record/brands")}
      onFavoriteClick={() => navigate("/favorites")}
      bottomNav
    >
      <section className="record-menu-page__search-section">
        <div className="record-menu-page__search-box">
          <SearchIcon />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="메뉴 검색"
            aria-label="메뉴 검색"
          />
        </div>
      </section>

      <div className="record-menu-page__category-list" role="tablist" aria-label="메뉴 카테고리">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`record-menu-page__category-button ${
              activeCategory === category ? "record-menu-page__category-button--active" : ""
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading && <p className="record-menu-page__message">메뉴를 불러오는 중이에요.</p>}

      {!isLoading && errorMessage && (
        <p className="record-menu-page__message record-menu-page__message--error">
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && filteredMenus.length === 0 && (
        <p className="record-menu-page__message">검색 결과가 없어요.</p>
      )}

      {!isLoading && !errorMessage && filteredMenus.length > 0 && (
        <section className="record-menu-page__list" aria-label="메뉴 목록">
          {filteredMenus.map((menu) => (
            <button
              key={menu.menuId}
              type="button"
              className="record-menu-card"
              onClick={() => handleMenuClick(menu)}
            >
              <span className="record-menu-card__image-wrap">
                {menu.imageUrl || menu.menuImageUrl ? (
                  <img
                    src={menu.imageUrl || menu.menuImageUrl}
                    alt=""
                    className="record-menu-card__image"
                  />
                ) : (
                  <span className="record-menu-card__fallback">
                    {getMenuEmoji(menu)}
                  </span>
                )}
              </span>

              <span className="record-menu-card__content">
                <span className="record-menu-card__name">{menu.menuName}</span>
                <span className="record-menu-card__category">{menu.categoryName}</span>
              </span>

              <span className="record-menu-card__caffeine">
                <strong>{menu.caffeineMg}</strong>
                <span>mg</span>
              </span>
            </button>
          ))}
        </section>
      )}
    </PageLayout>
  );
}

function decodeUrlValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getMenuEmoji(menu: MenuItem) {
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

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="2" />
      <path d="M15.6 15.6L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default RecordMenuPage;