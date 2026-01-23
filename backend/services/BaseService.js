/**
 * Base Service Class
 * Provides common methods for all services
 */
class BaseService {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all records with optional filtering, sorting, and pagination
   */
  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt', select = '' } = options;
    
    const skip = (page - 1) * limit;
    
    const query = this.model.find(filter);
    
    if (select) query.select(select);
    if (sort) query.sort(sort);
    if (limit) query.limit(limit);
    query.skip(skip);
    
    const results = await query.exec();
    const total = await this.model.countDocuments(filter);
    
    return {
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Find a single record by ID
   */
  async findById(id, populateOptions = '') {
    let query = this.model.findById(id);
    
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    
    const doc = await query.exec();
    
    if (!doc) {
      const { NotFoundError } = await import('../utils/errors.js');
      throw new NotFoundError(`${this.model.modelName} not found`);
    }
    
    return doc;
  }

  /**
   * Find a single record by field
   */
  async findOne(field, value) {
    const doc = await this.model.findOne({ [field]: value }).exec();
    
    if (!doc) {
      const { NotFoundError } = await import('../utils/errors.js');
      throw new NotFoundError(`${this.model.modelName} not found`);
    }
    
    return doc;
  }

  /**
   * Create a new record
   */
  async create(data) {
    const doc = new this.model(data);
    return await doc.save();
  }

  /**
   * Update a record by ID
   */
  async updateById(id, data, options = {}) {
    const { runValidators = true, new: isNew = true } = options;
    
    const doc = await this.model.findByIdAndUpdate(
      id,
      data,
      { runValidators, new: isNew }
    ).exec();
    
    if (!doc) {
      const { NotFoundError } = await import('../utils/errors.js');
      throw new NotFoundError(`${this.model.modelName} not found`);
    }
    
    return doc;
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id) {
    const doc = await this.model.findByIdAndDelete(id).exec();
    
    if (!doc) {
      const { NotFoundError } = await import('../utils/errors.js');
      throw new NotFoundError(`${this.model.modelName} not found`);
    }
    
    return doc;
  }

  /**
   * Soft delete a record (requires a 'deleted' field in schema)
   */
  async softDelete(id) {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { deleted: true, deletedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!doc) {
      const { NotFoundError } = await import('../utils/errors.js');
      throw new NotFoundError(`${this.model.modelName} not found`);
    }
    
    return doc;
  }

  /**
   * Restore a soft deleted record
   */
  async restore(id) {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { deleted: false, deletedAt: null },
      { new: true }
    ).exec();
    
    if (!doc) {
      const { NotFoundError } = await import('../utils/errors.js');
      throw new NotFoundError(`${this.model.modelName} not found`);
    }
    
    return doc;
  }

  /**
   * Aggregate data using MongoDB aggregation pipeline
   */
  async aggregate(pipeline) {
    return await this.model.aggregate(pipeline);
  }

  /**
   * Count documents matching a filter
   */
  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }
}

export default BaseService;