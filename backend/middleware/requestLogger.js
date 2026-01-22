import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// HTTP request logging middleware
export const requestLogger = (req, res, next) => {
  const requestId = uuidv4(); // Generate unique ID for each request
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Capture the original res.end method to log response
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log outgoing response
    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Call the original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled application error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  next(err);
};