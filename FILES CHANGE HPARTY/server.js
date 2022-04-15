const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const path = require("path");
const { authMiddleware } = require("./utils/auth");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { execute, subscribe } = require("graphql");
const { createServer } = require("http");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const { useServer } = require("graphql-ws/lib/use/ws");
const typeDefs = require("./schemas/typeDefs");
const resolvers = require("./schemas/resolvers");

const schema = makeExecutableSchema({ typeDefs, resolvers });
const app = express();
const httpServer = createServer(app);

const subscriptionServer = SubscriptionServer.create(
  { schema, execute, subscribe },
  { server: httpServer, path: "/graphql" }
);

const db = require("./config/connection");

const PORT = process.env.PORT || 3001;

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
            subscriptionServer.close();
          },
        };
      },
    },
  ],
  context: authMiddleware,
});

// // Creating the WebSocket server
// const wsServer = new WebSocketServer({
//   // This is the `httpServer` we created in a previous step.
//   server: httpServer,
//   // Pass a different path here if your ApolloServer serves at
//   // a different path.
//   path: "/graphql",
// });

// Hand in the schema we just created and have the
// WebSocketServer start listening.
// const serverCleanup = useServer({ schema }, wsServer);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

const startApolloServer = async (typeDefs, resolvers) => {
  await server.start();
  server.applyMiddleware({ app });

  db.once("open", () => {
    httpServer.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(
        `Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`
      );
    });
  });
};

startApolloServer(typeDefs, resolvers);
