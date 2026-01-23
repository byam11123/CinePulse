import mongoose from 'mongoose';
import { redisClient } from '../utils/cache.js';
import logger from '../utils/logger.js';

// Health check service
class HealthCheckService {
  // Check if the application is healthy
  async getAppHealth() {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      checks: {}
    };

    // Check database connection
    try {
      const dbState = mongoose.connection.readyState;
      const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      healthCheck.checks.database = {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        state: dbStates[dbState] || 'unknown',
        connected: dbState === 1
      };
    } catch (error) {
      healthCheck.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check Redis connection if available
    try {
      if (redisClient) {
        await redisClient.ping();
        healthCheck.checks.redis = {
          status: 'healthy',
          connected: true
        };
      } else {
        healthCheck.checks.redis = {
          status: 'not configured',
          connected: false
        };
      }
    } catch (error) {
      healthCheck.checks.redis = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check if all systems are healthy
    const allHealthy = Object.values(healthCheck.checks).every(check => 
      check.status === 'healthy' || check.status === 'not configured'
    );

    healthCheck.status = allHealthy ? 'healthy' : 'unhealthy';

    return healthCheck;
  }

  // Get detailed system information
  async getSystemInfo() {
    const systemInfo = {
      app: {
        name: process.env.npm_package_name || 'CinePulse Backend',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      },
      os: {
        platform: process.platform,
        arch: process.arch,
        release: process.release,
      },
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external,
      },
      cpu: {
        loadAverage: require('os').loadavg(),
      },
      timestamp: new Date().toISOString(),
    };

    return systemInfo;
  }

  // Check specific service
  async checkService(serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'database':
        return this.checkDatabase();
      case 'redis':
        return this.checkRedis();
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  // Check database specifically
  async checkDatabase() {
    try {
      const dbState = mongoose.connection.readyState;
      const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      
      return {
        service: 'database',
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        state: dbStates[dbState] || 'unknown',
        connected: dbState === 1,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        service: 'database',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Check Redis specifically
  async checkRedis() {
    try {
      if (!redisClient) {
        return {
          service: 'redis',
          status: 'not configured',
          connected: false,
          timestamp: new Date().toISOString()
        };
      }

      await redisClient.ping();
      
      return {
        service: 'redis',
        status: 'healthy',
        connected: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      return {
        service: 'redis',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new HealthCheckService();