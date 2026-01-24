import apiClient from "../utils/apiClient";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useContentStore } from "../store/content";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ORIGINAL_IMG_BASE_URL,
  SMALL_IMG_BASE_URL,
} from "../utils/constant";
import { formatReleaseDate } from "../utils/dateFunction";
import WatchPageSkeleton from "../components/skeletons/WatchPageSkeleton";
import type { ContentItem, Trailer } from "../types";

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [currentTrailersIdx, setCurrentTrailerIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [trailersLoading, setTrailersLoading] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [playerKey, setPlayerKey] = useState<number>(0); // Key to force remount of ReactPlayer
  const [content, setContent] = useState<ContentItem | null>(null);
  const [similarContent, setSimilarContent] = useState<ContentItem[]>([]);
  const { contentType } = useContentStore();

  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = content?.title || content?.name ?
      `Cinepulse | ${content.title || content.name}` :
      `Cinepulse | ${contentType === "movie" ? "Movie" : "TV Show"}`;
  }, [content, contentType]);

  useEffect(() => {
    const getTrailers = async () => {
      try {
        setTrailersLoading(true);
        const res = await apiClient.get(`/${contentType}/${id}/trailers`);
        if (res.data.trailers && Array.isArray(res.data.trailers)) {
          // Filter only YouTube trailers that are official and allow embedding
          const youtubeTrailers = res.data.trailers.filter(
            (trailer: any) =>
              trailer.site === "YouTube" &&
              (trailer.type === "Trailer" ||
                trailer.type === "Teaser" ||
                trailer.type === "Clip") &&
              trailer.key && // Ensure the key exists
              !trailer.name.toLowerCase().includes("deleted") && // Exclude deleted videos
              !trailer.name.toLowerCase().includes("removed") // Exclude removed videos
          );
          setTrailers(youtubeTrailers);

          // If we have valid trailers, reset the index and error state
          if (youtubeTrailers.length > 0) {
            setCurrentTrailerIdx(0);
            setVideoError(false);
            setPlayerKey((prev) => prev + 1);
          }
        } else {
          setTrailers([]);
        }
      } catch (error: any) {
        setTrailers([]);
      } finally {
        setTrailersLoading(false);
      }
    };
    getTrailers();
  }, [contentType, id]);
  useEffect(() => {
    const getSimilarContent = async () => {
      try {
        const res = await apiClient.get(`/${contentType}/${id}/similar`);
        setSimilarContent(res.data.similar);
      } catch (error: any) {
        setSimilarContent([]);
      }
    };
    getSimilarContent();
  }, [contentType, id]);

  useEffect(() => {
    const getContentDeatils = async () => {
      try {
        const res = await apiClient.get(`/${contentType}/${id}/details`);
        setContent(res.data.content);
      } catch (error: any) {
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
      setPlayerKey((prev) => prev + 1); // Force remount of iframe
    }
  };

  const handlePrev = () => {
    if (currentTrailersIdx > 0) {
      setCurrentTrailerIdx(currentTrailersIdx - 1);
      setVideoError(false); // Reset video error when changing videos
      setPlayerKey((prev) => prev + 1); // Force remount of iframe
    }
  };

  const scrollLeft = () => {
    if (sliderRef.current)
      sliderRef.current.scrollBy({
        left: -sliderRef.current.offsetWidth,
        behavior: "smooth",
      });
  };
  const scrollRight = () => {
    if (sliderRef.current)
      sliderRef.current.scrollBy({
        left: sliderRef.current.offsetWidth,
        behavior: "smooth",
      });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black p-10">
        <WatchPageSkeleton />
      </div>
    );

  if (!content) {
    return (
      <div className="bg-black text-white h-screen">
        <div className="max-w-6xl mx-auto">
          <Navbar />
          <div className="text-center mx-auto px-4 py-8 h-full mt-40">
            <h2 className="text-2xl sm:text-5xl font-bold text-balance">
              Content not found 😥
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto container px-4 py-8 h-full">
        <Navbar />
        {trailers.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <button
              className={`bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${currentTrailersIdx === 0 ? "opacity-50 cursor-not-allowed " : ""
                }}`}
              disabled={currentTrailersIdx === 0}
              onClick={handlePrev}
            >
              <ChevronLeft size={24} />
            </button>
            {/* <div className="text-sm text-gray-300 max-w-[50%] truncate">
              {content?.title || content?.name || "Movie/TV Show"}
            </div> */}
            <button
              className={`bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${currentTrailersIdx === trailers.length - 1
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
          {trailersLoading ? (
            <div className="w-full h-full bg-gray-800 rounded-lg animate-pulse shimmer"></div>
          ) : trailers.length > 0 ? (
            trailers[currentTrailersIdx] ? (
              trailers[currentTrailersIdx].key ? (
                !videoError ? (
                  <div className="relative w-full h-full">
                    <iframe
                      key={`iframe-${playerKey}-${trailers[currentTrailersIdx].key}`} // Force remount when video changes
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${trailers[currentTrailersIdx].key}?rel=0&modestbranding=1&enablejsapi=1&autoplay=0`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg overflow-hidden"
                      onError={() => {
                        setVideoError(true);
                      }}
                      onLoad={() => {
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
              <p className="text-gray-400">
                No trailers available for {content?.title || content?.name}
              </p>
            </div>
          )}
        </div>
        {/* movie details */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-20 max-w-6xl mx-auto">
          <div className="mb-4 md:mb-0">
            <h2 className="text-5xl font-bold text-balance">
              {content?.title || content?.name}
            </h2>
            <p className="mt-2 text-lg">
              {content?.release_date || content?.first_air_date ? formatReleaseDate(
                content.release_date || content.first_air_date || ''
              ) : ''}{" "}
              {content?.adult ? (
                <span className="text-red-600">18+</span>
              ) : (
                <span className="text-green-600">PG-13</span>
              )}{" "}
            </p>
            <p className="mt-4 text-lg">{content?.overview}</p>
          </div>
          <img
            src={ORIGINAL_IMG_BASE_URL + content?.poster_path}
            alt="Poster Image"
            className="max-h-[600px] rounded-md"
          />
        </div>
        {similarContent.length > 0 && (
          <div className="mt-12 max-w-5xl mx-auto relative">
            <div className="mb-4">
              <h3 className="text-3xl font-bold">Similar Movies/Tv Show</h3>
            </div>
            <div
              className="flex overflow-x-scroll scrollbar-hide gap-4 pb-4 group"
              ref={sliderRef}
            >
              {similarContent.map((content: ContentItem) => {
                if (content.poster_path === null) return null;
                return (
                  <Link
                    key={content.id}
                    to={`/watch/${content.id}`}
                    className="w-52 flex-shrink-0"
                  >
                    <img
                      src={SMALL_IMG_BASE_URL + content.poster_path}
                      alt="Poster Path"
                      className="w-full h-auto rounded-md"
                    />
                    <h4 className="mt-2 text-lg font-semibold">
                      {content.title || content.name}
                    </h4>
                  </Link>
                );
              })}
              <ChevronRight
                className="absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer bg-red-600 text-white rounded-full"
                onClick={scrollRight}
              />
              <ChevronLeft
                className="absolute top-1/2 -translate-y-1/2 left-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer bg-red-600 text-white rounded-full"
                onClick={scrollLeft}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchPage;
