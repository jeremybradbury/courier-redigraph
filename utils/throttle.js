const { getGraphQLRateLimiter } = require("graphql-rate-limit");
const rateLimiter = getGraphQLRateLimiter({ identifyContext: (ctx) => ctx.id });
const defaultLimit = { max: 2, window: "1s" };
const throttle = async ({
  parent,
  args,
  context,
  info,
  limit = defaultLimit,
}) => {
  const errorMessage = await rateLimiter(
    { parent, args, context, info },
    limit
  );
  if (errorMessage) throw new Error(errorMessage);
};

module.exports = throttle;
