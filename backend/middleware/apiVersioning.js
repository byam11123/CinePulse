// API Versioning Middleware
const apiVersioning = (req, res, next) => {
  // Extract version from header or URL
  let version = req.headers['api-version'] || req.query.version;
  
  // If no version specified in header or query, extract from URL path
  if (!version && req.path.startsWith('/api/')) {
    // Extract version from path like /api/v1/, /api/v2/, etc.
    const pathMatch = req.path.match(/^\/api\/v(\d+)\/.*$/);
    if (pathMatch) {
      version = pathMatch[1];
    }
  }
  
  // Default to version 1 if none specified
  req.apiVersion = version || '1';
  
  // Add version to response header
  res.setHeader('X-API-Version', req.apiVersion);
  
  next();
};

// Function to create version-specific routes
const createVersionedRoute = (version, routeHandler) => {
  return (req, res, next) => {
    if (req.apiVersion === version.toString()) {
      return routeHandler(req, res, next);
    }
    next(); // Pass to next route if version doesn't match
  };
};

// Function to handle deprecated versions
const handleDeprecatedVersion = (req, res, next) => {
  const deprecatedVersions = ['0']; // List of deprecated versions
  
  if (deprecatedVersions.includes(req.apiVersion)) {
    res.setHeader('X-API-Warning', `API version ${req.apiVersion} is deprecated. Please upgrade to the latest version.`);
  }
  
  next();
};

export { apiVersioning, createVersionedRoute, handleDeprecatedVersion };