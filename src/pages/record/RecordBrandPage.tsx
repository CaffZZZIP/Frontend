// 메뉴 브랜드 선택 페이지
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import {
  getMenuBrands,
  getMenus,
  resolveMenuImageUrl,
  type MenuBrand,
  type MenuItem,
} from "../../api/menuApi";
import "./RecordBrandPage.css";

type BrandCard = {
  brand: string;
  imageUrl?: string;
};

type BrandVisual = {
  label: string;
  tone: string;
};

function RecordBrandPage() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<BrandCard[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBrands = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [brandData, menuData] = await Promise.all([getMenuBrands(), getMenus()]);
        const normalizedBrands = normalizeBrands(brandData);

        if (!isMounted) {
          return;
        }

        setBrands(normalizedBrands);
        setMenus(menuData);
      } catch {
        if (isMounted) {
          setErrorMessage("브랜드 목록을 불러오지 못 했어요.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBrands = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase();

    if (!trimmedKeyword) {
      return brands;
    }

    return brands.filter((brandItem) => {
      const brandName = brandItem.brand.toLowerCase();
      const displayName = getBrandDisplayName(brandItem.brand).toLowerCase();
      const matchedByBrand =
        brandName.includes(trimmedKeyword) || displayName.includes(trimmedKeyword);

      const matchedByMenu = menus.some((menu) => {
        return (
          menu.brand === brandItem.brand &&
          menu.menuName.toLowerCase().includes(trimmedKeyword)
        );
      });

      return matchedByBrand || matchedByMenu;
    });
  }, [brands, menus, keyword]);

  const handleBrandClick = (brand: string) => {
    navigate(`/record/brands/${encodeURIComponent(brand)}/menus`, {
      state: { brand },
    });
  };

  return (
    <PageLayout
      className="record-brand-layout"
      contentClassName="record-brand-page"
      headerVariant="sub"
      title="카페인 기록 추가"
      showBack
      showFavorite
      onFavoriteClick={() => navigate("/favorites")}
      bottomNav
    >
      <section className="record-brand-page__search-section">
        <div className="record-brand-page__search-box">
          <SearchIcon />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="음료·음식 이름으로 검색"
            aria-label="음료 또는 음식 검색"
          />
        </div>
      </section>

      <section className="record-brand-page__section">
        <h2 className="record-brand-page__section-title">브랜드 선택</h2>

        {loading && <p className="record-brand-page__message">브랜드를 불러오는 중이야</p>}

        {!loading && errorMessage && (
          <p className="record-brand-page__message record-brand-page__message--error">
            {errorMessage}
          </p>
        )}

        {!loading && !errorMessage && filteredBrands.length === 0 && (
          <p className="record-brand-page__message">검색 결과가 없어</p>
        )}

        {!loading && !errorMessage && filteredBrands.length > 0 && (
          <div className="record-brand-page__grid">
            {filteredBrands.map((brandItem) => {
              const visual = getBrandVisual(brandItem.brand);

              return (
                <button
                  key={brandItem.brand}
                  type="button"
                  className="record-brand-card"
                  onClick={() => handleBrandClick(brandItem.brand)}
                >
                  <span className="record-brand-card__image-wrap">
                    <BrandImage imageUrl={brandItem.imageUrl} visual={visual} />
                  </span>
                  <span className="record-brand-card__name">
                    {getBrandDisplayName(brandItem.brand)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}

function BrandImage({ imageUrl, visual }: { imageUrl?: string; visual: BrandVisual }) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="record-brand-card__image"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`record-brand-card__fallback record-brand-card__fallback--${visual.tone}`}>
      {visual.label}
    </span>
  );
}

function normalizeBrands(data: MenuBrand[]): BrandCard[] {
  return data
    .map((item) => {
      return {
        brand: item.brand,
        imageUrl: resolveMenuImageUrl(item.logoUrl || item.imageUrl || item.brandImageUrl),
      };
    })
    .filter((item) => item.brand);
}

function getBrandDisplayName(brand: string) {
  const map: Record<string, string> = {
    스타벅스: "Starbucks",
    이디야: "EDIYA",
    할리스: "Hollys",
    탐앤탐스: "Tom N Toms",
    컴포즈: "Compose",
    몬스터: "Monster",
    메가커피: "Mega Coffee",
  };

  return map[brand] || brand;
}

function getBrandVisual(brand: string) {
  const normalized = brand.replace(/\s/g, "").toLowerCase();

  if (normalized.includes("starbucks") || normalized.includes("스타벅스")) {
    return { label: "☕", tone: "coffee" };
  }

  if (normalized.includes("ediya") || normalized.includes("이디야")) {
    return { label: "", tone: "yellow" };
  }

  if (normalized.includes("hollys") || normalized.includes("할리스")) {
    return { label: "", tone: "red" };
  }

  if (normalized.includes("tom") || normalized.includes("탐앤탐스")) {
    return { label: "", tone: "orange" };
  }

  if (normalized.includes("compose") || normalized.includes("컴포즈")) {
    return { label: "🐱", tone: "cat" };
  }

  if (normalized.includes("monster") || normalized.includes("몬스터")) {
    return { label: "⚡", tone: "lightning" };
  }

  if (normalized.includes("mega") || normalized.includes("메가")) {
    return { label: "", tone: "blue" };
  }

  if (normalized.includes("gong") || normalized.includes("공차")) {
    return { label: "🍵", tone: "tea" };
  }

  if (normalized.includes("디저트") || normalized.includes("dessert")) {
    return { label: "🍰", tone: "dessert" };
  }

  if (normalized.includes("음식") || normalized.includes("food")) {
    return { label: "🍱", tone: "food" };
  }

  return { label: "☕", tone: "coffee" };
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="2" />
      <path d="M15.6 15.6L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default RecordBrandPage;