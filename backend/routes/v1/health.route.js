import express from 'express';
import {
  healthCheck,
  systemInfo,
  serviceHealth,
  livenessProbe,
  readinessProbe
} from '../../controllers/health.controller.js';

const router = express.Router();

// General health check
router.get('/health', healthCheck);

// System information
router.get('/info', systemInfo);

// Service-specific health check
router.get('/service/:service', serviceHealth);

// Kubernetes/Docker probes
router.get('/live', livenessProbe);    // Liveness probe
router.get('/ready', readinessProbe);  // Readiness probe

export default router;