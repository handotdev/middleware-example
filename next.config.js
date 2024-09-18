const nextBuildId = require("next-build-id");

module.exports = {
  //IMPORTANT: if not set to true, the /next/xxx.../ part of urls will be cut out in the middleware, causing issues!
  skipMiddlewareUrlNormalize: true,
  assetPrefix: "/proxy_files",
  // _next/data are not being prefixed with the asset prefix
  generateBuildId: () =>
    nextBuildId({ dir: __dirname }).then((hash) => {
      return "proxy-app-" + hash;
    }),
};
