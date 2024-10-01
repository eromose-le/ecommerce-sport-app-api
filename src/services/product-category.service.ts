import prisma from "../lib/prisma";
import { ERROR_MESSAGES, HTTP_STATUS_CODE } from "../constants";
import { ErrorResponse } from "../utils/errorResponse";
import { NextFunction } from "express";
import { validateData } from "../helpers/validation";
import {
  CreateProductCategoryDTO,
  CreateProductCategoryResponse,
  GetProductCategoriesDTO,
  UpdateProductCategoryDTO,
  UpdateProductCategoryResponse,
} from "types/product-category.types";
import { createProductCategorySchema } from "../types/dto/product-category.dto";

export class ProductCategoryService {
  /**
   *
   * @param _query
   * @param _next
   * @returns products category list
   */
  async getProductCategories(
    _query: GetProductCategoriesDTO,
    _next: NextFunction
  ) {
    try {
      const productCategories = await prisma.category.findMany({
        where: {
          ...(!!_query && _query),
          deletedAt: null, // Fetch only active categories
        },
        include: {
          subcategories: {
            where: {
              deletedAt: null, // Fetch only active subcategories
            },
          },
        },
      });

      if (!productCategories) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.PRODUCT_CATEGORY_NOT_FOUND,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return productCategories;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_CATEGORY_GETS_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _id categoryId
   * @param _next
   * @returns product category details
   */
  async getProductCategory(_id: string, _next: NextFunction) {
    try {
      const productCategory = await prisma.category.findUnique({
        where: { id: _id },
        include: {
          subcategories: true,
        },
      });

      if (!productCategory) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.PRODUCT_CATEGORY_NOT_FOUND,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return productCategory;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_CATEGORY_GETS_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _payload name
   * @param _next
   * @returns product
   */
  async createProductCategory(
    _payload: CreateProductCategoryDTO,
    _next: NextFunction
  ): Promise<CreateProductCategoryResponse> {
    const validateProductCategory = (
      productCategory: CreateProductCategoryDTO
    ) => validateData(createProductCategorySchema, productCategory);

    const { name, description } = _payload;

    try {
      validateProductCategory(_payload);
      const productCategory = await prisma.category.create({
        data: {
          name,
          ...(description && { description }),
        },
      });

      if (!productCategory) {
        throw new ErrorResponse(
          ERROR_MESSAGES.PRODUCT_CATEGORY_CREATE_FAILED,
          HTTP_STATUS_CODE[400].code
        );
      }

      return productCategory;
    } catch (err: any) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_CATEGORY_CREATE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _id productId
   * @param _payload  name, description
   * @param _next
   * @returns product
   */
  async updateProductCategory(
    _id: string,
    _payload: UpdateProductCategoryDTO,
    _next: NextFunction
  ): Promise<UpdateProductCategoryResponse> {
    const { name, description } = _payload;
    try {
      await this.getProductCategory(_id, _next);
      const updatedProductCategory = await prisma.category.update({
        where: { id: _id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
        },
      });

      if (!updatedProductCategory) {
        throw new ErrorResponse(
          ERROR_MESSAGES.PRODUCT_CATEGORY_UPDATE_FAILED,
          HTTP_STATUS_CODE[400].code
        );
      }

      return updatedProductCategory;
    } catch (err: any) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_CATEGORY_UPDATE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  async deleteProductCategory(
    _dto: { id: string },
    _next: NextFunction
  ): Promise<null | void> {
    const { id: _id } = _dto;

    try {
      await prisma.category.delete({
        where: { id: _id },
      });

      return null;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_CATEGORY_DELETE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }
}
