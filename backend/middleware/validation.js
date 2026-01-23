import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], { 
        abortEarly: false, 
        stripUnknown: true 
      });
      
      if (error) {
        // Format validation errors
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        logger.warn('Validation error', { 
          errors, 
          property, 
          inputValue: req[property],
          url: req.originalUrl,
          method: req.method
        });
        
        throw new ValidationError(`Validation error: ${errors.map(e => e.message).join(', ')}`);
      }
      
      // Update the request object with validated and sanitized values
      req[property] = value;
      
      next();
    } catch (validationError) {
      next(validationError);
    }
  };
};

// Common validation schemas
const schemas = {
  // User registration schema
  userRegistration: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
      })
  }),

  // User login schema
  userLogin: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      })
  }),

  // Search query schema
  searchQuery: Joi.object({
    query: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Search query cannot be empty',
        'string.min': 'Search query must be at least 1 character long',
        'string.max': 'Search query cannot exceed 100 characters',
        'any.required': 'Search query is required'
      })
  }),

  // Movie/TV ID schema
  idParam: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'ID must be a number',
        'number.integer': 'ID must be an integer',
        'number.positive': 'ID must be a positive number',
        'any.required': 'ID is required'
      })
  }),

  // Search history removal schema
  removeFromHistory: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'ID must be a number',
        'number.integer': 'ID must be an integer',
        'number.positive': 'ID must be a positive number',
        'any.required': 'ID is required'
      })
  })
};

// Sanitization helper functions
const sanitizeInput = {
  // Sanitize string input
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()                    // Remove leading/trailing whitespace
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick, onload, etc.
  },

  // Sanitize object properties
  sanitizeObject: (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeInput.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  },

  // Sanitize array elements
  sanitizeArray: (arr) => {
    if (!Array.isArray(arr)) return arr;
    
    return arr.map(item => {
      if (typeof item === 'string') {
        return sanitizeInput.sanitizeString(item);
      } else if (typeof item === 'object' && item !== null) {
        return sanitizeInput.sanitizeObject(item);
      }
      return item;
    });
  }
};

// Middleware to sanitize all inputs
const sanitizeAllInputs = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      // Don't modify the original object, just sanitize its values
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitizeInput.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          req.query[key] = sanitizeInput.sanitizeObject(value);
        }
      }
    }

    // Sanitize body
    if (req.body) {
      if (typeof req.body === 'string') {
        req.body = sanitizeInput.sanitizeString(req.body);
      } else if (typeof req.body === 'object') {
        req.body = sanitizeInput.sanitizeObject(req.body);
      }
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = sanitizeInput.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          req.params[key] = sanitizeInput.sanitizeObject(value);
        }
      }
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error.message);
    next(error);
  }
};

export {
  validate,
  schemas,
  sanitizeInput,
  sanitizeAllInputs
};