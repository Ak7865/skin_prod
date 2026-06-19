import { MongoClient } from "mongodb"
import { getResolvedMongoUri } from "@/lib/mongoUri"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = getResolvedMongoUri(uri).then((resolvedUri) => {
      const client = new MongoClient(resolvedUri, options)
      return client.connect()
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  clientPromise = getResolvedMongoUri(uri).then((resolvedUri) => {
    const client = new MongoClient(resolvedUri, options)
    return client.connect()
  })
}

export default clientPromise
