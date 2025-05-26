import "dotenv/config";

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { userResolvers, userTypeDefs } from "./schemas/UserSchema.js";

const server = new ApolloServer({
  typeDefs: [userTypeDefs],
  resolvers: [userResolvers],
  introspection: true,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
