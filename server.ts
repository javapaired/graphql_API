const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const schema = require("./graphql/schema");
var config = require("./config/ormconfig.json");

// const auth = require("./middleware/auth");

const app = express();

// app.use("/graphql", authenticateJwt);
app.use("/graphql", (req: { userId: any }, res: any) => {
  graphqlHTTP({
    schema,
    graphiql: true,
    context: { userId: req.userId },
  })(req, res);
});

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}/graphql`);
});
