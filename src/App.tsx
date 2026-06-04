import { Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell/AppShell";
import LoginPage from "./pages/LoginPage/LoginPage";
import KakaoCallbackPage from "./pages/KakaoCallbackPage/KakaoCallbackPage";
import OnboardingPage from "./pages/OnboardingPage/OnboardingPage";
import HomePage from "./pages/HomePage/HomePage";
import { Navigate } from "react-router-dom";
import RecordBrandPage from "./pages/record/RecordBrandPage";
import RecordMenuPage from "./pages/record/RecordMenuPage";
import RecordMenuDetailPage from "./pages/record/RecordMenuDetailPage";
import ReportPage from "./pages/report/ReportPage";
import MyPage from "./pages/MyPage/MyPage";
import RoutineEditPage from "./pages/RoutineEditPage/RoutineEditPage";
import FavoritePage from "./pages/FavoritePage/FavoritePage";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/record" element={<Navigate to="/record/brands" replace />} />
        <Route path="/record/brands" element={<RecordBrandPage />} />
        <Route path="/record/brands/:brand/menus" element={<RecordMenuPage />} />
        <Route path="/record/brands/:brand/menus/:menuId" element={<RecordMenuDetailPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/routine-edit" element={<RoutineEditPage />} />
        <Route path="/favorites" element={<FavoritePage />} />
      </Route>
    </Routes>
  );
}

export default App;