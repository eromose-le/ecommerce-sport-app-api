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
exports.ProductCategoryService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const constants_1 = require("../constants");
const errorResponse_1 = require("../utils/errorResponse");
const validation_1 = require("../helpers/validation");
const product_category_dto_1 = require("../types/dto/product-category.dto");
class ProductCategoryService {
    /**
     *
     * @param _query
     * @param _next
     * @returns products category list
     */
    getProductCategories(_query, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const productCategories = yield prisma_1.default.category.findMany({
                    where: Object.assign(Object.assign({}, (!!_query && _query)), { deletedAt: null }),
                    include: {
                        subcategories: {
                            where: {
                                deletedAt: null, // Fetch only active subcategories
                            },
                        },
                    },
                });
                if (!productCategories) {
                    return _next(new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code));
                }
                return productCategories;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_GETS_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     *
     * @param _id categoryId
     * @param _next
     * @returns product category details
     */
    getProductCategory(_id, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const productCategory = yield prisma_1.default.category.findUnique({
                    where: { id: _id },
                    include: {
                        subcategories: true,
                    },
                });
                if (!productCategory) {
                    return _next(new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code));
                }
                return productCategory;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_GETS_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     *
     * @param _payload name
     * @param _next
     * @returns product
     */
    createProductCategory(_payload, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const validateProductCategory = (productCategory) => (0, validation_1.validateData)(product_category_dto_1.createProductCategorySchema, productCategory);
            const { name, description } = _payload;
            try {
                validateProductCategory(_payload);
                const productCategory = yield prisma_1.default.category.create({
                    data: Object.assign({ name }, (description && { description })),
                });
                if (!productCategory) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_CREATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return productCategory;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_CREATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    /**
     *
     * @param _id productId
     * @param _payload  name, description
     * @param _next
     * @returns product
     */
    updateProductCategory(_id, _payload, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, description } = _payload;
            try {
                yield this.getProductCategory(_id, _next);
                const updatedProductCategory = yield prisma_1.default.category.update({
                    where: { id: _id },
                    data: Object.assign(Object.assign({}, (name && { name })), (description && { description })),
                });
                if (!updatedProductCategory) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return updatedProductCategory;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    deleteProductCategory(_dto, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id: _id } = _dto;
            try {
                yield prisma_1.default.category.delete({
                    where: { id: _id },
                });
                return null;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PRODUCT_CATEGORY_DELETE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
}
exports.ProductCategoryService = ProductCategoryService;
