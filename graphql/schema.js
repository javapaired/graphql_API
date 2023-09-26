const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList,
} = require("graphql");

const { Pool } = require("pg");
var config = require("../config/ormconfig.json");

const pool = new Pool({
  user: config.database.username,
  host: config.database.host,
  database: config.database.dbname,
  password: config.database.password,
  port: config.database.port,
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000,
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLInt } },
      resolve(parent, args) {
        const { id } = args;
        if (!id) {
          throw new Error("User ID is required");
        }
        return (
          pool.query <
          UserType >
          ("SELECT * FROM users WHERE id = $1", [id])
            .then((result) => result.rows[0])
            .catch((error) => {
              throw new Error("Error fetching user");
            })
        );
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return (
          pool.query <
          UserType >
          "SELECT * FROM users"
            .then((result) => result.rows)
            .catch((error) => {
              throw new Error("Error fetching users");
            })
        );
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    register: {
      type: UserType,
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        email: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const { name, email, password } = args;

        if (!name || !email || !password) {
          throw new Error("Name, email, and password are required");
        }
        const existingUser = await pool
          .query("SELECT * FROM users WHERE email = $1", [email])
          .then((result) => result.rows[0]);

        if (existingUser) {
          throw new Error("User with this email already exists");
        }
        const hashedPassword = await bcryptjs.hash(password, 10);

        const query =
          "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *";
        const values = [name, email, hashedPassword];
        try {
          const result = await pool.query(query, values);

          // Generate a JWT token
          const user = result.rows[0];
          const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, {
            expiresIn: "10h", // Token expires in 10 hour
          });
          console.log(user, "Token", token);

          return { ...user, ...token };
        } catch (error) {
          throw new Error(error, "Error registering user");
        }
      },
    },
    login: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      async resolve(parent, args) {
        const { email, password } = args;

        // Find the user by email
        const user = await pool
          .query("SELECT * FROM users WHERE email = $1", [email])
          .then((result) => result.rows[0]);

        if (!user) {
          throw new Error("User not found");
        }

        // Check if the provided password matches the hashed password
        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, {
          expiresIn: "10h",
        });
        console.log(user, "Token", token);

        return { ...user, ...token };
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
