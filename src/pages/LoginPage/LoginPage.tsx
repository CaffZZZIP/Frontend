import PageLayout from "../../components/layout/PageLayout/PageLayout";
import logoImage from "../../assets/caffzzzzip_logo1.png";
import "./LoginPage.css";

const KAKAO_LOGIN_URL = "https://kauth.kakao.com/oauth/authorize?client_id=f1547964f5c0868887cf0e91fb8e9354&redirect_uri=http://52.79.54.46:8080/api/auth/kakao/callback&response_type=code";

function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = KAKAO_LOGIN_URL;
  };

  return (
    <PageLayout className="login-page">
      <section className="login-content">
        <div className="login-logo-box">
          <img className="login-logo-image" src={logoImage} alt="CaffZZZip 로고" />

          <h1 className="login-title">CaffZZZip</h1>
          <p className="login-subtitle">CAFFEINE × SLEEP TRACKER</p>
        </div>

        <button className="kakao-login-button" type="button" onClick={handleKakaoLogin}>
          <svg className="kakao-icon" viewBox="0 0 24 22" aria-hidden="true">
            <path d="M12 2C6.48 2 2 5.53 2 9.89c0 2.83 1.9 5.32 4.75 6.72l-.8 3.02c-.08.32.28.57.55.39l3.55-2.35c.63.08 1.28.12 1.95.12 5.52 0 10-3.53 10-7.9S17.52 2 12 2Z" />
          </svg>
          <span>카카오톡으로 로그인</span>
        </button>

        <p className="login-policy-text">
          로그인 이용약관 및 개인정보 처리방침에
          <br />
          동의하는 것으로 간주됩니다.
        </p>
      </section>
    </PageLayout>
  );
}

export default LoginPage;