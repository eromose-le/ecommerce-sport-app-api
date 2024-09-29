"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const constants_1 = require("../constants");
const errorResponse_1 = require("../utils/errorResponse");
const product_dto_1 = require("../types/dto/product.dto");
const validation_1 = require("../helpers/validation");
const update_product_attributes_1 = require("../helpers/update-product-attributes");
const utils_1 = require("../utils");
class ProductService {
    /**
     *
     * @param _query
     * @param _next
     * @returns products list
     */
    getProducts(_query, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { filter } = _query;
                const { sort, page, limit, q, category, subcategory, stock, color, type, size, price, minPrice, maxPrice, createdAt, updatedAt, } = filter !== null && filter !== void 0 ? filter : {};
                const { take, offset: skip, page: currentPage, limit: queryLimit, } = (0, utils_1.getPaginationParams)(page, limit);
                const whereFilter = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ deletedAt: null }, (category && {
                    category: {
                        name: category,
                    },
                })), (subcategory && {
                    subcategory: {
                        name: subcategory,
                    },
                })), (stock && { stock: { gte: parseInt(stock) } })), (createdAt && {
                    createdAt: {
                        gte: new Date(createdAt),
                    },
                })), (updatedAt && {
                    updatedAt: {
                        gte: new Date(updatedAt),
                    },
                })), (minPrice && {
                    price: {
                        gte: parseFloat(minPrice),
                    },
                })), (maxPrice && {
                    price: {
                        lte: parseFloat(maxPrice),
                    },
                })), ((price === null || price === void 0 ? void 0 : price.range.length) === 2 && {
                    price: {
                        gte: Number((_a = price === null || price === void 0 ? void 0 : price.range) === null || _a === void 0 ? void 0 : _a[0]), // Lower bound of price range
                        lte: Number((_b = price === null || price === void 0 ? void 0 : price.range) === null || _b === void 0 ? void 0 : _b[1]), // Upper bound of price range
                    },
                })), (createdAt && {
                    createdAt: {
                        gte: new Date(createdAt).toISOString(), // Only show products created after this date
                    },
                })), (q && {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                    ],
                })), { colors: {
                        some: {
                            colorId: Object.assign({}, (color ? { in: color } : {})),
                        },
                    }, sizes: {
                        some: {
                            sizeId: Object.assign({}, (size ? { in: size } : {})),
                        },
                    }, types: {
                        some: {
                            typeId: Object.assign({}, (type ? { in: type } : {})),
                        },
                    } });
                const [results, count] = yield Promise.all([
                    prisma_1.default.product.findMany({
                        where: whereFilter,
                        include: {
                            category: true,
                            subcategory: true,
                            sizes: true,
                            colors: true,
                            types: true,
                        },
                        orderBy: Object.assign({}, (sort && {
                            price: sort === "asc" ? "asc" : "desc",
                        })), // Add sorting here
                        take,
                        skip,
                    }),
                    prisma_1.default.product.count({
                        where: whereFilter,
                    }),
                ]);
                if (!results) {
                    return _next(new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code));
                }
                return {
                    currentPage,
                    count,
                    pageCount: (0, utils_1.getPageCount)(count, queryLimit),
                    results,
                };
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_GETS_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     *
     * @param _id productId
     * @param _next
     * @returns product details
     */
    getProduct(_id, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield prisma_1.default.product.findUnique({
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
                    return _next(new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code));
                }
                return product;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_GETS_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     *
     * @param _payload name, description, price, stock, specification, keyattribute, categoryId, subcategoryId, sizeIds, colorIds, typeIds,
     * @param _next
     * @returns product
     */
    createProduct(_payload, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const validateProduct = (product) => (0, validation_1.validateData)(product_dto_1.createProductSchema, product);
            const { name, description, price, stock, specification, keyattribute, categoryId, subcategoryId, sizeIds, colorIds, typeIds, displayImage, medias, } = _payload;
            try {
                validateProduct(_payload);
                const product = yield prisma_1.default.product.create({
                    data: {
                        name,
                        description,
                        price,
                        stock,
                        specification: specification,
                        keyattribute: keyattribute,
                        categoryId,
                        subcategoryId,
                        sizes: {
                            create: sizeIds === null || sizeIds === void 0 ? void 0 : sizeIds.map((sizeId) => ({ sizeId })),
                        },
                        colors: {
                            create: colorIds === null || colorIds === void 0 ? void 0 : colorIds.map((colorId) => ({ colorId })),
                        },
                        types: {
                            create: typeIds === null || typeIds === void 0 ? void 0 : typeIds.map((typeId) => ({ typeId })),
                        },
                        displayImage,
                        medias: medias,
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
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CREATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return product;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CREATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     *
     * @param _id productId
     * @param _payload  name, description, price, stock, specification, keyattribute, categoryId, subcategoryId,
     * @param _next
     * @returns product
     */
    updateProduct(_id, _payload, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, description, price, stock, displayImage, medias, specification, keyattribute, categoryId, subcategoryId, } = _payload;
            try {
                const updatedProduct = yield prisma_1.default.product.update({
                    where: { id: _id },
                    data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (description && { description })), (price && { price })), (stock && { stock })), (displayImage && { displayImage })), (medias && {
                        medias: Array.isArray(medias) ? medias : JSON.parse(medias),
                    })), (specification && {
                        specification: Array.isArray(specification)
                            ? specification
                            : JSON.parse(specification),
                    })), (keyattribute && {
                        keyattribute: Array.isArray(keyattribute)
                            ? keyattribute
                            : JSON.parse(keyattribute),
                    })), (categoryId && {
                        category: {
                            connect: {
                                id: categoryId,
                            },
                        },
                    })), (subcategoryId && {
                        subcategory: {
                            connect: {
                                id: subcategoryId,
                            },
                        },
                    })),
                });
                if (!updatedProduct) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return updatedProduct;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     *
     * @param _id productId
     * @param _payload sizeIds[]
     * @param _next
     * @returns
     */
    updateProductSize(_id, _payload, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sizeIds = [] } = _payload;
            const updatedProducts = [];
            try {
                for (const sizeId of sizeIds) {
                    const productOnSize = yield prisma_1.default.productOnSize.findUnique({
                        where: {
                            productId_sizeId: {
                                productId: _id,
                                sizeId: sizeId,
                            },
                        },
                    });
                    if (!productOnSize) {
                        throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
                    }
                    const updatedProductOnSize = yield prisma_1.default.productOnSize.update({
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
                        throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
                    }
                    updatedProducts.push(updatedProductOnSize);
                }
                return updatedProducts;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     * Updates product attributes such as size, color, and type.
     *
     * @param _id - The product ID.
     * @param _payload - An object containing arrays of sizeIds, colorIds, and typeIds.
     * @param _next - The next function for error handling.
     * @returns A promise that resolves to an array of updated product attributes.
     */
    updateProductAttributes(_id, _payload, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sizeIds = [], colorIds = [], typeIds = [] } = _payload;
            try {
                const updatedProducts = yield Promise.all([
                    sizeIds.length >= 0
                        ? (0, update_product_attributes_1.updateProductAttribute)(_id, "size", sizeIds, _next)
                        : [],
                    colorIds.length >= 0
                        ? (0, update_product_attributes_1.updateProductAttribute)(_id, "color", colorIds, _next)
                        : [],
                    typeIds.length >= 0
                        ? (0, update_product_attributes_1.updateProductAttribute)(_id, "type", typeIds, _next)
                        : [],
                ]);
                // Flatten the array of arrays into a single array
                return updatedProducts.flat();
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    deleteProduct(_dto, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id: _id } = _dto;
            try {
                yield prisma_1.default.product.delete({
                    where: { id: _id },
                });
                return null;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_DELETE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
}
exports.ProductService = ProductService;
