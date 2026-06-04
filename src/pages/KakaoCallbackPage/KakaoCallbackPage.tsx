// // export default KakaoCallbackPage;
// import { useEffect, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";

// type LoginData = {
//   accessToken?: string;
//   refreshToken?: string;
//   isFirstLogin?: boolean | string;
//   userId?: number | string;
//   nickname?: string;
// };

// const clearAuthStorage = () => {
//   localStorage.removeItem("accessToken");
//   localStorage.removeItem("refreshToken");
//   localStorage.removeItem("userId");
//   localStorage.removeItem("nickname");
//   localStorage.removeItem("isFirstLogin");
// };

// const saveLoginData = (data: LoginData) => {
//   if (!data.accessToken) {
//     return false;
//   }

//   clearAuthStorage();

//   localStorage.setItem("accessToken", data.accessToken);

//   if (data.refreshToken) {
//     localStorage.setItem("refreshToken", data.refreshToken);
//   }

//   if (data.userId !== undefined && data.userId !== null) {
//     localStorage.setItem("userId", String(data.userId));
//   }

//   if (data.nickname) {
//     localStorage.setItem("nickname", data.nickname);
//   }

//   if (data.isFirstLogin !== undefined && data.isFirstLogin !== null) {
//     localStorage.setItem("isFirstLogin", String(data.isFirstLogin));
//   }

//   return true;
// };

// const isFirstLoginValue = (value: LoginData["isFirstLogin"]) => {
//   return value === true || value === "true";
// };

// function KakaoCallbackPage() {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [message, setMessage] = useState("로그인 처리 중...");

//   useEffect(() => {
//     const failLogin = (text: string) => {
//       clearAuthStorage();
//       setMessage(text);

//       window.setTimeout(() => {
//         navigate("/login", { replace: true });
//       }, 1200);
//     };

//     const accessToken = searchParams.get("accessToken");
//     const refreshToken = searchParams.get("refreshToken") || undefined;
//     const isFirstLogin = searchParams.get("isFirstLogin") || undefined;
//     const userId = searchParams.get("userId") || undefined;
//     const nickname = searchParams.get("nickname") || undefined;
//     const error = searchParams.get("error");

//     if (error) {
//       failLogin("카카오 로그인에 실패했어.");
//       return;
//     }

//     if (!accessToken) {
//       failLogin("로그인 토큰을 받지 못했어.");
//       return;
//     }

//     const loginData: LoginData = {
//       accessToken,
//       refreshToken,
//       isFirstLogin,
//       userId,
//       nickname,
//     };

//     const saved = saveLoginData(loginData);

//     if (!saved) {
//       failLogin("로그인 정보를 저장하지 못했어.");
//       return;
//     }

//     if (isFirstLoginValue(isFirstLogin)) {
//       navigate("/onboarding", { replace: true });
//       return;
//     }

//     navigate("/home", { replace: true });
//   }, [searchParams, navigate]);

//   return (
//     <div
//       style={{
//         minHeight: "100dvh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         fontSize: 14,
//         color: "#6f5a4a",
//       }}
//     >
//       {message}
//     </div>
//   );
// }

// export default KakaoCallbackPage;
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type LoginData = {
  accessToken: string;
  refreshToken?: string;
  isFirstLogin?: string;
  userId?: string;
  nickname?: string;
};

const clearLoginStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("isFirstLogin");
  localStorage.removeItem("userId");
  localStorage.removeItem("nickname");
};

const saveLoginStorage = (loginData: LoginData) => {
  clearLoginStorage();

  localStorage.setItem("accessToken", loginData.accessToken);

  if (loginData.refreshToken) {
    localStorage.setItem("refreshToken", loginData.refreshToken);
  }

  if (loginData.isFirstLogin) {
    localStorage.setItem("isFirstLogin", loginData.isFirstLogin);
  }

  if (loginData.userId) {
    localStorage.setItem("userId", loginData.userId);
  }

  if (loginData.nickname) {
    localStorage.setItem("nickname", loginData.nickname);
  }
};

function KakaoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken") || undefined;
    const isFirstLogin = searchParams.get("isFirstLogin") || "false";
    const userId = searchParams.get("userId") || undefined;
    const nickname = searchParams.get("nickname") || undefined;
    const error = searchParams.get("error");

    if (error) {
      clearLoginStorage();
      setMessage("카카오 로그인에 실패했어.");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);

      return;
    }

    if (!accessToken) {
      clearLoginStorage();
      setMessage("로그인 토큰을 받지 못했어.");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);

      return;
    }

    saveLoginStorage({
      accessToken,
      refreshToken,
      isFirstLogin,
      userId,
      nickname,
    });

    if (isFirstLogin === "true") {
      navigate("/onboarding", { replace: true });
      return;
    }

    navigate("/home", { replace: true });
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        color: "#6f5a4a",
      }}
    >
      {message}
    </div>
  );
}

export default KakaoCallbackPage;