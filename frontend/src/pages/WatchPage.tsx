import axios from "axios";
import React, { useEffect } from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useContentStore } from "../store/content.js";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";
const WatchPage = () => {
  const { id } = useParams();
  const [trailers, setTrailers] = useState([]);
  const [currentTrailersIdx, setCurrentTrailerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [playerKey, setPlayerKey] = useState(0); // Key to force remount of ReactPlayer
  const [content, setContent] = useState({});
  const [similarContent, setSimilarContent] = useState([]);
  const { contentType } = useContentStore();

  useEffect(() => {
    const getTrailers = async () => {
      try {
        console.log(`Fetching trailers for ${contentType}/${id}`);
        console.log(
          "Base URL for request:",
          `/api/v1/${contentType}/${id}/trailers`
        );
        const res = await axios.get(`/api/v1/${contentType}/${id}/trailers`);
        console.log("Full trailers response:", res.data);
        if (res.data.trailers && Array.isArray(res.data.trailers)) {
          // Filter only YouTube trailers that are official and allow embedding
          const youtubeTrailers = res.data.trailers.filter(
            (trailer) =>
              trailer.site === "YouTube" &&
              (trailer.type === "Trailer" ||
                trailer.type === "Teaser" ||
                trailer.type === "Clip") &&
              trailer.key && // Ensure the key exists
              !trailer.name.toLowerCase().includes("deleted") && // Exclude deleted videos
              !trailer.name.toLowerCase().includes("removed") // Exclude removed videos
          );
          console.log("Filtered YouTube trailers:", youtubeTrailers);
          setTrailers(youtubeTrailers);

          // If we have valid trailers, reset the index and error state
          if (youtubeTrailers.length > 0) {
            setCurrentTrailerIdx(0);
            setVideoError(false);
            setPlayerKey((prev) => prev + 1);
          }
        } else {
          console.log("Trailers is not an array or is null");
          setTrailers([]);
        }
      } catch (error) {
        console.error("Error fetching trailers:", error);
        console.error(
          "Error details:",
          error.response || error.message || error
        );
        if (error.message.includes("404")) {
          setTrailers([]);
        } else {
          setTrailers([]);
        }
      }
    };
    getTrailers();
  }, [contentType, id]);
  useEffect(() => {
    const getSimilarContent = async () => {
      try {
        const res = await axios.get(`/api/v1/${contentType}/${id}/similar`);
        setSimilarContent(res.data.similar);
      } catch (error) {
        if (error.message.includes("404")) {
          setSimilarContent([]);
        }
      }
    };
    getSimilarContent();
  }, [contentType, id]);

  useEffect(() => {
    const getContentDeatils = async () => {
      try {
        const res = await axios.get(`/api/v1/${contentType}/${id}/details`);
        setContent(res.data.content);
      } catch (error) {
        if (error.message.includes("404")) {
          setContent(null);
        }
      } finally {
        setLoading(false);
      }
    };
    getContentDeatils();
  }, [contentType, id]);

  const handleNext = () => {
    if (currentTrailersIdx < trailers.length - 1) {
      setCurrentTrailerIdx(currentTrailersIdx + 1);
      setVideoError(false); // Reset video error when changing videos
      setPlayerKey((prev) => prev + 1); // Force remount of ReactPlayer
    }
  };

  const handlePrev = () => {
    if (currentTrailersIdx > 0) {
      setCurrentTrailerIdx(currentTrailersIdx - 1);
      setVideoError(false); // Reset video error when changing videos
      setPlayerKey((prev) => prev + 1); // Force remount of ReactPlayer
    }
  };

  console.log("Trailers:", trailers);
  console.log("SimilarContent:", similarContent);
  console.log("ContentDetails:", content);

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto container px-4 py-8 h-full">
        <Navbar />
        {trailers.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <button
              className={`bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${
                currentTrailersIdx === 0 ? "opacity-50 cursor-not-allowed " : ""
              }}`}
              disabled={currentTrailersIdx === 0}
              onClick={handlePrev}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-sm text-gray-300">
              {currentTrailersIdx + 1} / {trailers.length} -{" "}
              {trailers[currentTrailersIdx]?.name || "Trailer"}
            </div>
            <button
              className={`bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${
                currentTrailersIdx === trailers.length - 1
                  ? "opacity-50 cursor-not-allowed "
                  : ""
              }}`}
              disabled={currentTrailersIdx === trailers.length - 1}
              onClick={handleNext}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
        <div className="aspect-video mb-8 p-2 sm:px-10 md:px-32">
          {trailers.length > 0 ? (
            trailers[currentTrailersIdx] ? (
              trailers[currentTrailersIdx].key ? (
                !videoError ? (
                  <div className="relative w-full h-full">
                    <iframe
                      key={`iframe-${playerKey}-${trailers[currentTrailersIdx].key}`} // Force remount when video changes
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${trailers[currentTrailersIdx].key}?rel=0&modestbranding=1&enablejsapi=1&autoplay=0`}
                      title={
                        trailers[currentTrailersIdx].name ||
                        "YouTube video player"
                      }
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg overflow-hidden"
                      onError={() => {
                        console.log(
                          "Iframe failed to load video with key:",
                          trailers[currentTrailersIdx].key
                        );
                        setVideoError(true);
                      }}
                      onLoad={() => {
                        console.log(
                          "Iframe loaded video:",
                          trailers[currentTrailersIdx].name
                        );
                        setVideoError(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 rounded-lg p-4">
                    <p className="text-gray-400 mb-2">Unable to load video</p>
                    <p className="text-gray-500 text-sm text-center">
                      This video cannot be embedded. Click below to watch on
                      YouTube.
                    </p>
                    <a
                      href={`https://www.youtube.com/watch?v=${trailers[currentTrailersIdx].key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
                  <p className="text-gray-400">
                    Video key not available for this trailer
                  </p>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
                <p className="text-gray-400">
                  Current trailer index out of bounds
                </p>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
              <p className="text-gray-400">No trailers available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
