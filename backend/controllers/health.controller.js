import HealthCheckService from '../services/HealthCheckService.js';
import { ValidationError } from '../utils/errors.js';

// Health check endpoint
export const healthCheck = async (req, res, next) => {
  try {
    const health = await HealthCheckService.getAppHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      ...health
    });
  } catch (error) {
    next(error);
  }
};

// System info endpoint
export const systemInfo = async (req, res, next) => {
  try {
    const systemInfo = await HealthCheckService.getSystemInfo();
    
    res.status(200).json({
      success: true,
      ...systemInfo
    });
  } catch (error) {
    next(error);
  }
};

// Service-specific health check
export const serviceHealth = async (req, res, next) => {
  try {
    const { service } = req.params;
    
    if (!service) {
      throw new ValidationError('Service name is required');
    }
    
    const serviceHealth = await HealthCheckService.checkService(service);
    
    const statusCode = serviceHealth.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      ...serviceHealth
    });
  } catch (error) {
    next(error);
  }
};

// Liveness probe (for Kubernetes/Docker)
export const livenessProbe = async (req, res) => {
  // Simple liveness check - just respond with OK
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

// Readiness probe (for Kubernetes/Docker)
export const readinessProbe = async (req, res, next) => {
  try {
    const health = await HealthCheckService.getAppHealth();
    
    // For readiness, we might want to be more strict about dependencies
    const isReady = health.checks.database.connected;
    
    if (isReady) {
      res.status(200).json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};