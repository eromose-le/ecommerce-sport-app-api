import prisma from "../lib/prisma";
import { ERROR_MESSAGES, HTTP_STATUS_CODE } from "../constants";
import { ErrorResponse } from "../utils/errorResponse";
import { NextFunction } from "express";
import {
  CreateProductDTO,
  ProductAttributeUpdateResponse,
  Specification,
  Keyattribute,
  UpdateProductDTO,
  UpdateProductSizeDTO,
  UpdateProductSizeResponse,
  ProductListQueryDTO,
} from "../types/product.types";
import { createProductSchema, Medias } from "../types/dto/product.dto";
import { validateData } from "../helpers/validation";
import { updateProductAttribute } from "../helpers/update-product-attributes";
import { Product } from "../models";
import { getPageCount, getPaginationParams } from "../utils";

export class ProductService {
  /**
   *
   * @param _query
   * @param _next
   * @returns products list
   */
  async getProducts(_query: any, _next: NextFunction) {
    try {
      const { filter } = _query;

      const {
        sort,
        page,
        limit,
        q,
        category,
        subcategory,
        stock,
        color,
        type,
        size,
        price,
        minPrice,
        maxPrice,
        createdAt,
        updatedAt,
      } = filter ?? {};

      const {
        take,
        offset: skip,
        page: currentPage,
        limit: queryLimit,
      } = getPaginationParams(page as string, limit as string);

      const whereFilter: any = {
        deletedAt: null, // Products that aren't soft-deleted

        // Filter by category and subcategory if provided
        ...(category && {
          category: {
            name: category,
          },
        }),
        ...(subcategory && {
          subcategory: {
            name: subcategory,
          },
        }),

        // Filter by stock count
        ...(stock && { stock: { gte: parseInt(stock) } }),

        // Filter by date created and updated
        ...(createdAt && {
          createdAt: {
            gte: new Date(createdAt),
          },
        }),
        ...(updatedAt && {
          updatedAt: {
            gte: new Date(updatedAt),
          },
        }),

        // Filter by price range
        ...(minPrice && {
          price: {
            gte: parseFloat(minPrice),
          },
        }),
        ...(maxPrice && {
          price: {
            lte: parseFloat(maxPrice),
          },
        }),

        // Filter by price range (using array input)
        ...(price?.range.length === 2 && {
          price: {
            gte: Number(price?.range?.[0]), // Lower bound of price range
            lte: Number(price?.range?.[1]), // Upper bound of price range
          },
        }),

        // Filter by creation date (newly uploaded products)
        ...(createdAt && {
          createdAt: {
            gte: new Date(createdAt).toISOString(), // Only show products created after this date
          },
        }),

        // Dynamic search across various fields
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }),

        // Conditionally filter by color
        ...(Array.isArray(color) &&
          color.length > 0 && {
            colors: {
              some: {
                colorId: { in: color },
              },
            },
          }),

        // Conditionally filter by size
        ...(Array.isArray(size) &&
          size.length > 0 && {
            sizes: {
              some: {
                sizeId: { in: size },
              },
            },
          }),

        // Conditionally filter by type
        ...(Array.isArray(type) &&
          type.length > 0 && {
            types: {
              some: {
                typeId: { in: type },
              },
            },
          }),
      };

      const [results, count] = await Promise.all([
        prisma.product.findMany({
          where: whereFilter,
          include: {
            category: true,
            subcategory: true,
            sizes: true,
            colors: true,
            types: true,
          },
          orderBy: {
            ...(sort && {
              price: sort === "asc" ? "asc" : "desc",
            }),
          }, // Add sorting here
          take,
          skip,
        }),

        prisma.product.count({
          where: whereFilter,
        }),
      ]);

      if (!results) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.PRODUCT_NOT_FOUND,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return {
        currentPage,
        count,
        pageCount: getPageCount(count, queryLimit),
        results,
      };
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
          reviews: true,
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
   * @param _payload name, description, price, stock, specification, keyattribute, categoryId, subcategoryId, sizeIds, colorIds, typeIds,
   * @param _next
   * @returns product
   */
  async createProduct(
    _payload: CreateProductDTO,
    _next: NextFunction
  ): Promise<Product> {
    const validateProduct = (product: CreateProductDTO) =>
      validateData(createProductSchema, product);

    const {
      name,
      description,
      price,
      stock,
      specification,
      keyattribute,
      categoryId,
      subcategoryId,
      sizeIds,
      colorIds,
      typeIds,
      displayImage,
      medias,
    } = _payload;

    try {
      validateProduct(_payload);
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          specification: specification as Specification,
          keyattribute: keyattribute as Keyattribute,
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
          displayImage,
          medias: medias as Medias,
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
          HTTP_STATUS_CODE[400].code
        );
      }

      return product;
    } catch (err: any) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.PRODUCT_CREATE_FAILED,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  /**
   *
   * @param _id productId
   * @param _payload  name, description, price, stock, specification, keyattribute, categoryId, subcategoryId,
   * @param _next
   * @returns product
   */
  async updateProduct(
    _id: string,
    _payload: UpdateProductDTO,
    _next: NextFunction
  ): Promise<Product> {
    const {
      name,
      description,
      price,
      stock,
      displayImage,
      medias,
      specification,
      keyattribute,
      categoryId,
      subcategoryId,
    } = _payload;
    try {
      const updatedProduct = await prisma.product.update({
        where: { id: _id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(price && { price }),
          ...(stock && { stock }),
          ...(displayImage && { displayImage }),
          ...(medias && {
            medias: Array.isArray(medias) ? medias : JSON.parse(medias),
          }),
          ...(specification && {
            specification: Array.isArray(specification)
              ? specification
              : JSON.parse(specification),
          }),
          ...(keyattribute && {
            keyattribute: Array.isArray(keyattribute)
              ? keyattribute
              : JSON.parse(keyattribute),
          }),
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
   * Updates product attributes such as size, color, and type.
   *
   * @param _id - The product ID.
   * @param _payload - An object containing arrays of sizeIds, colorIds, and typeIds.
   * @param _next - The next function for error handling.
   * @returns A promise that resolves to an array of updated product attributes.
   */
  async updateProductAttributes(
    _id: string,
    _payload: { sizeIds?: string[]; colorIds?: string[]; typeIds?: string[] },
    _next: NextFunction
  ): Promise<ProductAttributeUpdateResponse> {
    const { sizeIds = [], colorIds = [], typeIds = [] } = _payload;

    try {
      const updatedProducts = await Promise.all([
        sizeIds.length >= 0
          ? updateProductAttribute(_id, "size", sizeIds, _next)
          : [],
        colorIds.length >= 0
          ? updateProductAttribute(_id, "color", colorIds, _next)
          : [],
        typeIds.length >= 0
          ? updateProductAttribute(_id, "type", typeIds, _next)
          : [],
      ]);

      // Flatten the array of arrays into a single array
      return updatedProducts.flat();
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
