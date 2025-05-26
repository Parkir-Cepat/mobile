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

    type LoginResponse {
        token: String
        user: User
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

    input loginInput {
        email: String
        password: String
    }

    input googleLogin {
        idToken: String
    }

    type Mutation {
        register(newUser: registerInput): User
        login(user: loginInput): LoginResponse
        loginGoogle(input: googleLogin): LoginResponse
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
    login: async (parent, args) => {
      const { email, password } = args.user;
      const result = await UserModel.login({ email, password });
      return result;
    },
    loginGoogle: async (parent, args) => {
      const { idToken } = args.input;
      const token = await UserModel.loginGoogle({ idToken });
      return token;
    },
  },
};
