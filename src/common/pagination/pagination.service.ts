import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import {
  PaginatedResponse,
  PaginationMeta,
  PaginationOptions,
} from './interfaces/pagination.interface';
import { SortOrder } from './enums/sort-order.enum';
import { PaginationQueryDto } from './dtos/pagination-query.dto';

@Injectable()
export class PaginationService {
  async paginate<T extends Document>(
    model: Model<T>,
    filter: Record<string, any> = {},
    options: PaginationOptions,
    select?: string | Record<string, number>,
  ): Promise<PaginatedResponse<T>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }
    if (limit < 1) {
      throw new Error('Limit must be greater than 0');
    }

    const skip = (page - 1) * limit;

    const sort: Record<string, 1 | -1> = {};
    const normalizedSortOrder =
      typeof sortOrder === 'string' ? sortOrder.toLowerCase() : 'desc';
    const isAscending = normalizedSortOrder === 'asc';
    sort[sortBy] = isAscending ? 1 : -1;

    const [data, total] = await Promise.all([
      model
        .find(filter)
        .select(select || '')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      data: data as T[],
      meta,
    };
  }

  buildFilter<T extends Record<string, unknown>>(
    queryDto: T,
    searchFields?: string[],
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (queryDto['search'] && searchFields && searchFields.length > 0) {
      filter.$or = searchFields.map((field) => ({
        [field]: { $regex: String(queryDto['search']), $options: 'i' },
      }));
    }

    const excludeFields = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];
    Object.keys(queryDto).forEach((key) => {
      const value = queryDto[key];
      if (
        !excludeFields.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        filter[key] = value;
      }
    });

    return filter;
  }

  getPaginationOptions<T extends PaginationQueryDto>(
    queryDto: T,
  ): PaginationOptions {
    return {
      page: queryDto.page ?? 1,
      limit: queryDto.limit ?? 10,
      sortBy: queryDto.sortBy ?? 'createdAt',
      sortOrder:
        queryDto.sortOrder === SortOrder.ASC
          ? 'asc'
          : queryDto.sortOrder === SortOrder.DESC
            ? 'desc'
            : 'desc',
    };
  }
}
