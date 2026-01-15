import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu, Search } from "lucide-react";
import { useAuthStore } from "../store/authUser.js";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return (
    <header className="relative max-w-5xl mx-auto flex items-center justify-between p-4 h-20 ">
      <div className="flex items-center gap-10 z-50">
        <Link to={"/"}>
          <img
            src="/netflix-logo.png"
            alt="Netflix Logo"
            className="w-32 sm:w-40"
          />
        </Link>
        {/* desktop navbar items*/}
        <div className="hidden sm:flex gap-2 items-center">
          <Link to={"/"} className="hover:underline">
            Movies
          </Link>
          <Link to={"/"} className="hover:underline">
            TV Shows
          </Link>
          <Link to="/history" className="hover:underline">
            Search History
          </Link>
        </div>
      </div>
      <div className="flex gap-2 items-center z-50">
        <Link to={"/search"}>
          <Search className="size-6 cursor-pointer" />
        </Link>
        <img
          src={user.image}
          alt="Avatar"
          className="h-8 rounded cursor-pointer"
        />
        <LogOut className="size-6 cursor-pointer" onClick={logout} />

        <div className="sm:hidden">
          <Menu className="size-6 cursor-pointer" onClick={toggleMobileMenu} />
        </div>
      </div>

      {/* mobile nav items */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full sm:hidden mt-7 z-40 bg-black border border-gray-800 rounded">
          <Link
            to={"/"}
            className="block p-3 hover:bg-gray-800"
            onClick={toggleMobileMenu}
          >
            Movies
          </Link>
          <Link
            to={"/"}
            className="block p-3 hover:bg-gray-800"
            onClick={toggleMobileMenu}
          >
            TV Shows
          </Link>
          <Link
            to="/history"
            className="block p-3 hover:bg-gray-800"
            onClick={toggleMobileMenu}
          >
            Search History
          </Link>
        </div>
      )}

      {/* <div>
          <Link to={"/"}>Home</Link>
          <Link to={"/"}>Movies</Link>
          <Link to={"/"}>TV Shows</Link>
          <Link to="/history">Search History</Link>
        </div> */}
    </header>
  );
};

export default Navbar;
