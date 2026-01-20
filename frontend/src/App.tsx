import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage.tsx";
import WatchPage from "./pages/WatchPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import Footer from "./components/Footer.tsx";
import SearchHistoryPage from "./pages/SearchHistoryPage.tsx";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authUser.js";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import NotFoundPage from "./pages/404";

function App() {
  const { user, isCheckingAuth, authCheck } = useAuthStore();
  console.log("auth user is here:", user);

  useEffect(() => {
    authCheck();
  }, [authCheck]);
  if (isCheckingAuth) {
    return (
      <div className="h-screen">
        <div className="flex justify-center items-center bg-black h-full">
          <Loader className="animate-spin text-red-600 size-10"></Loader>
        </div>
      </div>
    );
  }
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/signup"
          element={!user ? <SignUpPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/watch/:id"
          element={user ? <WatchPage /> : <Navigate to={"/login"} />}
        />{" "}
        <Route
          path="/search"
          element={user ? <SearchPage /> : <Navigate to={"/login"} />}
        />
        <Route
          path="/history"
          element={user ? <SearchHistoryPage /> : <Navigate to={"/login"} />}
        />
        <Route path="/*" element={<NotFoundPage />} />
      </Routes>
      <Footer></Footer>
      <Toaster />
    </>
  );
}

export default App;
