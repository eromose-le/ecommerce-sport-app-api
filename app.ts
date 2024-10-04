import express, { Express } from "express";
import "module-alias/register";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import { green, white } from "console-log-colors";
import { DEFAULT_PORT } from "./src/constants";
import { EnvKeys } from "./src/common/EnvKeys";
import { errorHandler } from "./src/middleware/error";
import { createRouteHandler } from "uploadthing/express";

import authRoute from "./src/routes/auth.route";
import uploadRoute from "./src/routes/upload.route";
import userRoute from "./src/routes/user.route";
import reviewRoute from "./src/routes/coupon.route";
import couponRoute from "./src/routes/coupon.route";
import paymentRoute from "./src/routes/payment.route";
import bookmarkRoute from "./src/routes/bookmark.route";
import orderRoute from "./src/routes/order.route";
import productRoute from "./src/routes/product.route";
import productSizeRoute from "./src/routes/product-size.route";
import productColorRoute from "./src/routes/product-color.route";
import productCategoryRoute from "./src/routes/product-category.route";
import productSubcategoryRoute from "./src/routes/product-subcategory.route";
import { uploadRouter } from "./src/services/providers/uploadthing";
import { corsOptions } from "./src/configs/cors";

const app: Express = express();
const apiPath = "/api/v1";

app.use(fileUpload());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

if (EnvKeys.isLocal()) {
  app.use(morgan("dev"));
}

app.use(`${apiPath}/auth`, authRoute);
app.use(`${apiPath}/users`, userRoute);
app.use(`${apiPath}/products/subcategory`, productSubcategoryRoute);
app.use(`${apiPath}/products/category`, productCategoryRoute);
app.use(`${apiPath}/products/color`, productColorRoute);
app.use(`${apiPath}/products/size`, productSizeRoute);
app.use(`${apiPath}/products`, productRoute);
app.use(`${apiPath}/orders`, orderRoute);
app.use(`${apiPath}/bookmarks`, bookmarkRoute);
app.use(`${apiPath}/reviews`, reviewRoute);
app.use(`${apiPath}/coupons`, couponRoute);
app.use(`${apiPath}/payments`, paymentRoute);
app.use(
  `${apiPath}/uploads`,
  createRouteHandler({
    router: uploadRouter,
    config: {
      // callbackUrl: "https://b3cd-102-89-44-29.ngrok-free.app",
    },
  }),
  uploadRoute
);

app.use(errorHandler);

const PORT = process.env.PORT || DEFAULT_PORT;

app.listen(PORT, () => {
  console.log(
    green.bgWhiteBright(
      `Server is running on  - ${white.bgGreenBright.bold(PORT)}`
    )
  );
});
