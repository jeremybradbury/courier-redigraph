const { ApolloServer } = require("apollo-server");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");

// Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  debug: process.env.NODE_ENV !== "production",
});

server
  .listen()
  .then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  })
  .catch((error) => {
    console.error(error);
  });
