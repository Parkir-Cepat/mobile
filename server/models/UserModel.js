import { getDb } from "../config/mongodb.js";
import { comparePassword, hashPassword } from "../helpers/bcrypt.js";
import { generateToken } from "../helpers/jwt.js";

const userCollection = () => getDb().collection("users");

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export default class UserModel {
  static async register({ email, password, name, role, amount }) {
    if (!email) throw new Error("Email is required");

    if (!password) throw new Error("Password is required");

    if (!name) throw new Error("Name is required");

    if (password.length < 6)
      throw new Error("Password must be at least 6 characters");

    if (!validateEmail(email)) throw new Error("Invalid email format");

    const unique = await userCollection().findOne({ email });
    if (unique) throw new Error("Email or Username already registered");

    const allowedRoles = ["owner", "seeker"];
    if (!allowedRoles.includes(role)) {
      throw new Error("Invalid role. Must be either 'owner' or 'seeker'");
    }

    const hashed = hashPassword(password);

    const newUser = {
      email,
      password: hashed,
      name,
      role,
      amount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await userCollection().insertOne(newUser);
    newUser._id = result.insertedId;

    delete newUser.password;
    return newUser;
  }

  static async login({ email, password }) {
    if (!email) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");

    const user = await userCollection().findOne({ email });
    if (!user) throw new Error("Invalid email or password");

    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid email or password");

    const token = generateToken({ _id: user._id });
    return {
      token,
      user,
    };
  }
}
