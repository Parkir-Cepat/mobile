import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_CONNECTION_URI;
console.log(uri, "<<<<< INI URI MONGODB");

export const client = new MongoClient(uri);
let db = null;

function connect() {
  db = client.db("ParkirenDb");
  return db;
}

export function getDb() {
  if (!db) return connect();
  return db;
}
