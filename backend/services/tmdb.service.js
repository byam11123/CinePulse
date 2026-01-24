import axios from "axios";
import { ENV_VARS } from "../config/envVars.js";
import logger from "../utils/logger.js";
import { getCache, setCache } from "../utils/cache.js";
import { AppError } from "../utils/errors.js";

const MAX_RETRIES = 3;
const COOLDOWN_MS = 1000;
const AXIOS_TIMEOUT = 10000; // 10 seconds

export const fetchFromTMDB = async (url) => {
  try {
    // Check cache first
    const cachedData = await getCache(url);
    if (cachedData) {
      return cachedData;
    }

    if (!ENV_VARS.TMDB_API_KEY) {
      logger.error("TMDB_API_KEY is not set in environment variables");
      throw new Error("TMDB API key is not configured");
    }

    const options = {
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + ENV_VARS.TMDB_API_KEY,
      },
      timeout: AXIOS_TIMEOUT,
    };

    let response;
    let attempt = 0;

    // Retry logic
    while (attempt < MAX_RETRIES) {
      try {
        response = await axios.get(url, options);
        break; // Success, exit loop
      } catch (err) {
        attempt++;
        // If it's the last attempt or a 4xx error (client error), don't retry, throw immediately
        // Exception: 429 Might actually want to retry, but usually we respect the header.
        // For 404/400/401, retrying won't help.
        if (
          attempt >= MAX_RETRIES ||
          (err.response && err.response.status >= 400 && err.response.status < 500 && err.response.status !== 429)
        ) {
          throw err;
        }

        // Wait before retrying (exponential backoff could be used here, but simple linear for now)
        logger.warn(`Retrying TMDB request (${attempt}/${MAX_RETRIES}) for ${url}`, { error: err.message });
        await new Promise(resolve => setTimeout(resolve, COOLDOWN_MS));
      }
    }

    if (!response) {
      throw new Error("Request failed after retries");
    }

    // Cache the successful response
    await setCache(url, response.data, 3600);

    return response.data;
  } catch (error) {
    logger.error("Error fetching from TMDB", {
      url,
      error: error.message,
      code: error.code,
      responseStatus: error.response?.status
    });

    if (error.response) {
      throw new AppError(
        `TMDB Error: ${error.response.statusText || error.message}`,
        error.response.status
      );
    }

    if (error instanceof AppError) {
      throw error;
    }

    // Handle Timeouts explicitly
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new AppError('Upstream Service Timeout', 504);
    }

    throw new AppError(error.message, 500);
  }
};
