"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("module-alias/register");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const console_log_colors_1 = require("console-log-colors");
const constants_1 = require("./src/constants");
const EnvKeys_1 = require("./src/common/EnvKeys");
const error_1 = require("./src/middleware/error");
const express_2 = require("uploadthing/express");
const auth_route_1 = __importDefault(require("./src/routes/auth.route"));
const upload_route_1 = __importDefault(require("./src/routes/upload.route"));
const user_route_1 = __importDefault(require("./src/routes/user.route"));
const coupon_route_1 = __importDefault(require("./src/routes/coupon.route"));
const coupon_route_2 = __importDefault(require("./src/routes/coupon.route"));
const payment_route_1 = __importDefault(require("./src/routes/payment.route"));
const bookmark_route_1 = __importDefault(require("./src/routes/bookmark.route"));
const order_route_1 = __importDefault(require("./src/routes/order.route"));
const product_route_1 = __importDefault(require("./src/routes/product.route"));
const product_size_route_1 = __importDefault(require("./src/routes/product-size.route"));
const product_color_route_1 = __importDefault(require("./src/routes/product-color.route"));
const product_category_route_1 = __importDefault(require("./src/routes/product-category.route"));
const product_subcategory_route_1 = __importDefault(require("./src/routes/product-subcategory.route"));
const uploadthing_1 = require("./src/services/providers/uploadthing");
const cors_2 = require("./src/configs/cors");
const app = (0, express_1.default)();
const apiPath = "/api/v1";
app.use((0, express_fileupload_1.default)());
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
if (EnvKeys_1.EnvKeys.isLocal()) {
    app.use((0, morgan_1.default)("dev"));
}
app.use(`${apiPath}/auth`, auth_route_1.default);
app.use(`${apiPath}/users`, user_route_1.default);
app.use(`${apiPath}/products/subcategory`, product_subcategory_route_1.default);
app.use(`${apiPath}/products/category`, product_category_route_1.default);
app.use(`${apiPath}/products/color`, product_color_route_1.default);
app.use(`${apiPath}/products/size`, product_size_route_1.default);
app.use(`${apiPath}/products`, product_route_1.default);
app.use(`${apiPath}/orders`, order_route_1.default);
app.use(`${apiPath}/bookmarks`, bookmark_route_1.default);
app.use(`${apiPath}/reviews`, coupon_route_1.default);
app.use(`${apiPath}/coupons`, coupon_route_2.default);
app.use(`${apiPath}/payments`, payment_route_1.default);
app.use(`${apiPath}/uploads`, (0, express_2.createRouteHandler)({
    router: uploadthing_1.uploadRouter,
    config: {
    // callbackUrl: "https://b3cd-102-89-44-29.ngrok-free.app",
    },
}), upload_route_1.default);
app.use(error_1.errorHandler);
const PORT = process.env.PORT || constants_1.DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(console_log_colors_1.green.bgWhiteBright(`Server is running on  - ${console_log_colors_1.white.bgGreenBright.bold(PORT)}`));
});
