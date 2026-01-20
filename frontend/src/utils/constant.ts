export const SMALL_IMG_BASE_URL: string = "https://image.tmdb.org/t/p/w500/";
export const ORIGINAL_IMG_BASE_URL: string = "https://image.tmdb.org/t/p/original/";

export const MOVIE_CATEGORIES: string[] = [
  "now_playing",
  "top_rated",
  "popular",
  "upcoming",
];
export const TV_CATEGORIES: string[] = [
  "airing_today",
  "on_the_air",
  "popular",
  "top_rated",
];

// Define category mappings for URL routes (with hyphens)
export const URL_CATEGORY_TITLES: Record<string, string> = {
  // Movie categories
  "now-playing": "Now Playing Movies",
  "top-rated": "Top Rated Movies",
  "popular": "Popular Movies",
  "upcoming": "Upcoming Movies",

  // TV categories
  "airing-today": "TV Shows Airing Today",
  "on-the-air": "TV Shows On The Air",
  "popular-tv": "Popular TV Shows",
  "top-rated-tv": "Top Rated TV Shows",
};

// Helper function to get readable title from slug
export const getCategoryTitle = (slug: string): string => {
  // First try the URL format (hyphens)
  if (URL_CATEGORY_TITLES[slug]) {
    return URL_CATEGORY_TITLES[slug];
  }
  // Then try the underscore format
  const underscoreSlug = slug.replace(/-/g, '_');

  // Handle the duplicate keys by checking context separately
  if (underscoreSlug === "popular") {
    return "Popular Content"; // Generic fallback
  }
  if (underscoreSlug === "top_rated") {
    return "Top Rated Content"; // Generic fallback
  }

  const underscoreTitles: Record<string, string> = {
    "now_playing": "Now Playing Movies",
    "upcoming": "Upcoming Movies",
    "airing_today": "TV Shows Airing Today",
    "on_the_air": "TV Shows On The Air",
  };
  return underscoreTitles[underscoreSlug] || slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to determine if it's a movie or TV category
export const isMovieCategory = (slug: string): boolean => {
  const movieCategories = ["now_playing", "top_rated", "popular", "upcoming"];
  const movieUrlCategories = ["now-playing", "top-rated", "popular", "upcoming"];
  return movieCategories.includes(slug) || movieUrlCategories.includes(slug);
};

export const isTVCategory = (slug: string): boolean => {
  const tvCategories = ["airing_today", "on_the_air", "popular", "top_rated"];
  const tvUrlCategories = ["airing-today", "on-the-air", "popular-tv", "top-rated-tv"];
  return tvCategories.includes(slug) || tvUrlCategories.includes(slug);
};
