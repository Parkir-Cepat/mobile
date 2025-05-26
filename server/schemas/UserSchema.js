import UserModel from "../models/UserModel.js";

export const userTypeDefs = `#gql
    type User {
        _id: ID
        email: String
        name: String
        role: String
        amount: Float
        createdAt: String
        updatedAt: String
    }

    type Query {
    _dummy: String
    }

    input registerInput {
        email: String
        password: String
        name: String
        role: String
        amount: Float
    }

    type Mutation {
        register(newUser: registerInput): User
    }
`;

export const userResolvers = {
  Query: {
    _dummy: () => "dummy",
  },
  Mutation: {
    register: async (parent, args) => {
      const { newUser } = args;
      const user = await UserModel.register(newUser);
      return user;
    },
  },
};
