import { fetchFromTMDB } from "../services/tmdb.service.js";

export async function getTrendingTv(req, res, next) {
  try {
    const data = await fetchFromTMDB(
      "https://api.themoviedb.org/3/trending/tv/day?language=en-US"
    );
    const randomTv =
      data.results[Math.floor(Math.random() * data.results?.length)];

    res.json({ success: true, content: randomTv });
  } catch (error) {
    next(error);
  }
}

export async function getTvTrailers(req, res, next) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/videos?language=en-US`
    );
    res.json({ success: true, trailers: data.results });
  } catch (error) {
    next(error);
  }
}

export async function getTvDetails(req, res, next) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}?language=en-US`
    );
    res.json({ success: true, content: data });
  } catch (error) {
    next(error);
  }
}

export async function getSimiliarTv(req, res, next) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/similar?language=en-US&page=1`
    );
    res.json({ success: true, similar: data.results });
  } catch (error) {
    next(error);
  }
}
export async function getCategoryTvs(req, res, next) {
  const { category } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${category}?language=en-US&page=1`
    );
    res.json({ success: true, content: data.results });
  } catch (error) {
    next(error);
  }
}
