import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authUser.js";
import Navbar from "../../components/Navbar.tsx";
import { Info, Play } from "lucide-react";

const HomeScreen = () => {
  const { logout } = useAuthStore();
  return (
    <>
      <div className="relative h-screen text-white">
        <Navbar />

        {/* Background image */}
        <img
          src="/extraction.jpg"
          alt="hero img"
          className="absolute inset-0 w-full h-full object-cover -z-50"
        />

        {/* Dark gradient from top */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-transparent -z-40" />

        {/* Content area */}
        <div className="relative z-10 h-full flex items-center">
          <div className="px-8 md:px-16 lg:px-32 max-w-xl">
            <h1 className="text-5xl md:text-6xl font-extrabold">Extraction</h1>

            <p className="mt-2 text-lg">2014 | 18+</p>

            <p className="mt-4 text-lg">
              Chris Hemsworth stars in this nonstop action-thriller with
              Rudhraksh Jaiswal, Randeep Hooda and Golshifteh Farahani.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <Link
                to="/watch/123"
                className="bg-white hover:bg-white/80 text-black font-bold py-2 px-6 rounded flex items-center"
              >
                <Play className="size-6 mr-2 fill-black" />
                Play
              </Link>
              <Link
                to="/watch/123"
                className="bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-6 rounded flex items-center"
              >
                <Info className="size-6 mr-2" />
                More Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeScreen;
