import prisma from "../lib/prisma";
import { ERROR_MESSAGES, HTTP_STATUS_CODE } from "../constants";
import { ErrorResponse } from "../utils/errorResponse";
import { NextFunction } from "express";
import {
  CreateProductDTO,
  CreateProductResponse,
  GetProductDTO,
  GetProductsDTO,
  ProductAttributeUpdateResponse,
  UpdateProductDTO,
  UpdateProductResponse,
  UpdateProductSizeDTO,
  UpdateProductSizeResponse,
} from "../types/product.types";
import { createProductSchema } from "../types/dto/product.dto";
import { validateData } from "../helpers/validation";
import { updateProductAttribute } from "../helpers/update-product-attributes";

export class ProductService {
  /**
   *
   * @param _query
   * @param _next
   * @returns products list
   */
  async getProducts(_query: GetProductsDTO, _next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        where: {
          ...(_query && _query),
        },
      });

      if (!products) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.PRODUCT_NOT_FOUND,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return products;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_GETS_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _id productId
   * @param _next
   * @returns product details
   */
  async getProduct(_id: string, _next: NextFunction) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: _id },
        include: {
          category: true,
          subcategory: true,
          sizes: {
            select: {
              size: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          colors: {
            select: {
              color: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          types: {
            select: {
              type: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          orders: true,
        },
      });

      if (!product) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.PRODUCT_NOT_FOUND,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return product;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_GETS_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _payload name, description, price, stock, categoryId, subcategoryId, sizeIds, colorIds, typeIds,
   * @param _next
   * @returns product
   */
  async createProduct(
    _payload: CreateProductDTO,
    _next: NextFunction
  ): Promise<CreateProductResponse> {
    const validateProduct = (product: CreateProductDTO) =>
      validateData(createProductSchema, product);

    const {
      name,
      description,
      price,
      stock,
      categoryId,
      subcategoryId,
      sizeIds,
      colorIds,
      typeIds,
    } = _payload;

    try {
      validateProduct(_payload);
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          categoryId,
          subcategoryId,
          sizes: {
            create: sizeIds?.map((sizeId: string) => ({ sizeId })),
          },
          colors: {
            create: colorIds?.map((colorId: string) => ({ colorId })),
          },
          types: {
            create: typeIds?.map((typeId: string) => ({ typeId })),
          },
        },
        include: {
          category: true,
          subcategory: true,
          sizes: true,
          colors: true,
          types: true,
          orders: true,
        },
      });

      if (!product) {
        throw new ErrorResponse(
          ERROR_MESSAGES.PRODUCT_CREATE_FAILED,
          HTTP_STATUS_CODE[500].code
        );
      }

      return product;
    } catch (err: any) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_CREATE_FAILED,
        HTTP_STATUS_CODE[500].code
      );
    }
  }

  /**
   *
   * @param _id productId
   * @param _payload  name, description, price, stock, categoryId, subcategoryId,
   * @param _next
   * @returns product
   */
  async updateProduct(
    _id: string,
    _payload: UpdateProductDTO,
    _next: NextFunction
  ): Promise<UpdateProductResponse> {
    const { name, description, price, stock, categoryId, subcategoryId } =
      _payload;
    try {
      const updatedProduct = await prisma.product.update({
        where: { id: _id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(price && { price }),
          ...(stock && { stock }),
          ...(categoryId && {
            category: {
              connect: {
                id: categoryId,
              },
            },
          }),
          ...(subcategoryId && {
            subcategory: {
              connect: {
                id: subcategoryId,
              },
            },
          }),
        },
      });

      if (!updatedProduct) {
        throw new ErrorResponse(
          ERROR_MESSAGES.PRODUCT_UPDATE_FAILED,
          HTTP_STATUS_CODE[400].code
        );
      }

      return updatedProduct;
    } catch (err: any) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_UPDATE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _id productId
   * @param _payload sizeIds[]
   * @param _next
   * @returns
   */
  async updateProductSize(
    _id: string,
    _payload: UpdateProductSizeDTO,
    _next: NextFunction
  ): Promise<UpdateProductSizeResponse[]> {
    const { sizeIds = [] } = _payload;
    const updatedProducts: UpdateProductSizeResponse[] = [];

    try {
      for (const sizeId of sizeIds) {
        const productOnSize = await prisma.productOnSize.findUnique({
          where: {
            productId_sizeId: {
              productId: _id,
              sizeId: sizeId,
            },
          },
        });

        if (!productOnSize) {
          throw new ErrorResponse(
            ERROR_MESSAGES.PRODUCT_NOT_FOUND,
            HTTP_STATUS_CODE[400].code
          );
        }

        const updatedProductOnSize = await prisma.productOnSize.update({
          where: {
            productId_sizeId: {
              productId: _id,
              sizeId: sizeId,
            },
          },
          data: {
            sizeId: sizeId,
          },
        });

        if (!updatedProductOnSize) {
          throw new ErrorResponse(
            ERROR_MESSAGES.PRODUCT_UPDATE_FAILED,
            HTTP_STATUS_CODE[400].code
          );
        }

        updatedProducts.push(updatedProductOnSize);
      }

      return updatedProducts;
    } catch (err: any) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_UPDATE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _id productId
   * @param _payload sizeIds[] | colorIds[] | typeIds[]
   * @param _next
   * @returns
   */
  async updateProductAttributes(
    _id: string,
    _payload: any,
    _next: NextFunction
  ): Promise<ProductAttributeUpdateResponse> {
    const { sizeIds = [], colorIds = [], typeIds = [] } = _payload;

    let updatedProducts: ProductAttributeUpdateResponse = [];

    try {
      if (sizeIds.length > 0) {
        const updatedSizes = await updateProductAttribute(
          _id,
          "size",
          sizeIds,
          _next
        );
        updatedProducts = updatedProducts.concat(updatedSizes);
      }

      if (colorIds.length > 0) {
        const updatedColors = await updateProductAttribute(
          _id,
          "color",
          colorIds,
          _next
        );
        updatedProducts = updatedProducts.concat(updatedColors);
      }

      if (typeIds.length > 0) {
        const updatedTypes = await updateProductAttribute(
          _id,
          "type",
          typeIds,
          _next
        );
        updatedProducts = updatedProducts.concat(updatedTypes);
      }

      return updatedProducts;
    } catch (err: any) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_UPDATE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  async deleteProduct(
    _dto: { id: string },
    _next: NextFunction
  ): Promise<null | void> {
    const { id: _id } = _dto;

    try {
      await prisma.product.delete({
        where: { id: _id },
      });

      return null;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_DELETE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }
}
