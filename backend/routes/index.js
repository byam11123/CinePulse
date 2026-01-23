// Main routes index file with versioning support

// Import v1 routes
import authRoutes from './v1/auth.route.js';
import movieRoutes from './v1/movie.route.js';
import tvRoutes from './v1/tv.route.js';
import searchRoutes from './v1/search.route.js';
import healthRoutes from './v1/health.route.js';

// Export all routes
export {
  authRoutes,
  movieRoutes,
  tvRoutes,
  searchRoutes,
  healthRoutes
};