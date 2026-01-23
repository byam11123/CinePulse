import logger from './logger.js';

/**
 * Utility functions for database query optimization
 */

// Function to create optimized queries with proper indexing hints
const createOptimizedQuery = (model, query, options = {}) => {
  const { sort, limit, select, populate, indexHint } = options;
  
  let dbQuery = model.find(query);
  
  // Apply selection fields if specified
  if (select) {
    dbQuery = dbQuery.select(select);
  }
  
  // Apply sorting if specified
  if (sort) {
    dbQuery = dbQuery.sort(sort);
  }
  
  // Apply population if specified
  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }
  
  // Apply limit if specified
  if (limit) {
    dbQuery = dbQuery.limit(limit);
  }
  
  return dbQuery;
};

// Function to execute paginated queries
const executePaginatedQuery = async (model, query, page = 1, limit = 10, options = {}) => {
  try {
    const skip = (page - 1) * limit;
    
    // Count total documents matching the query
    const total = await model.countDocuments(query);
    
    // Execute the query with pagination
    const results = await model.find(query)
      .skip(skip)
      .limit(limit)
      .sort(options.sort || { createdAt: -1 }) // Default sort by creation date
      .select(options.select)
      .populate(options.populate);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      results,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    };
  } catch (error) {
    logger.error('Error executing paginated query', { error: error.message, query });
    throw error;
  }
};

// Function to create indexes for better performance
const createIndexes = async (model, indexes) => {
  try {
    for (const index of indexes) {
      await model.createIndex(index.fields, index.options);
      logger.info('Index created', { model: model.modelName, index: index.fields });
    }
  } catch (error) {
    logger.error('Error creating indexes', { error: error.message, model: model.modelName });
    throw error;
  }
};

// Function to optimize database queries with caching
const queryWithCache = async (cacheKey, model, query, options = {}, cacheTime = 300) => {
  // Import cache here to avoid circular dependencies
  const { getCache, setCache } = await import('./cache.js');
  
  try {
    // Try to get from cache first
    let result = await getCache(cacheKey);
    
    if (result) {
      logger.info('Query result from cache', { cacheKey });
      return result;
    }
    
    // If not in cache, execute the query
    result = await createOptimizedQuery(model, query, options).exec();
    
    // Store in cache
    await setCache(cacheKey, result, cacheTime);
    
    logger.info('Query result stored in cache', { cacheKey });
    return result;
  } catch (error) {
    logger.error('Error in queryWithCache', { error: error.message, cacheKey });
    throw error;
  }
};

// Function to aggregate data efficiently
const executeAggregation = async (model, pipeline) => {
  try {
    const result = await model.aggregate(pipeline);
    return result;
  } catch (error) {
    logger.error('Error in aggregation query', { error: error.message, pipeline });
    throw error;
  }
};

// Function to perform bulk operations
const executeBulkOperation = async (model, operations) => {
  try {
    const bulk = model.collection.initializeUnorderedBulkOp();
    
    for (const operation of operations) {
      if (operation.type === 'insert') {
        bulk.insert(operation.document);
      } else if (operation.type === 'update') {
        bulk.find(operation.selector).updateOne(operation.update);
      } else if (operation.type === 'delete') {
        bulk.find(operation.selector).deleteOne();
      }
    }
    
    const result = await bulk.execute();
    return result;
  } catch (error) {
    logger.error('Error in bulk operation', { error: error.message });
    throw error;
  }
};

export {
  createOptimizedQuery,
  executePaginatedQuery,
  createIndexes,
  queryWithCache,
  executeAggregation,
  executeBulkOperation
};