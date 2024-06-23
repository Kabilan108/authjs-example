Certainly! Let's implement the `getUserByEmail` function for the credentials handler. This function will query the MongoDB database to find a user by their email address.

We'll need to update the auth configuration file (app/api/auth/[...nextauth]/route.ts) to include this function and use it in the credentials provider.



```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

// Helper function to get user by email
async function getUserByEmail(email: string) {
  const client = await MongoClient.connect(process.env.MONGODB_URI as string);
  const db = client.db();
  const user = await db.collection("users").findOne({ email });
  client.close();
  return user;
}

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await getUserByEmail(credentials.email);
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return { 
            id: user._id.toString(),
            email: user.email,
            name: user.name
          };
        }
        return null;
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
});

export { handler as GET, handler as POST };

```

Let's break down the changes and additions:

1. We've imported `MongoClient` and `ObjectId` from the `mongodb` package.

2. We've implemented the `getUserByEmail` function:
   ```typescript
   async function getUserByEmail(email: string) {
     const client = await MongoClient.connect(process.env.MONGODB_URI as string);
     const db = client.db();
     const user = await db.collection("users").findOne({ email });
     client.close();
     return user;
   }
   ```
   This function connects to the MongoDB database, queries the "users" collection for a user with the given email, and then closes the connection.

3. In the `CredentialsProvider`, we've updated the `authorize` function to use `getUserByEmail`:
   ```typescript
   async authorize(credentials) {
     if (!credentials?.email || !credentials?.password) {
       return null;
     }
     const user = await getUserByEmail(credentials.email);
     if (user && await bcrypt.compare(credentials.password, user.password)) {
       return { 
         id: user._id.toString(),
         email: user.email,
         name: user.name
       };
     }
     return null;
   }
   ```
   This function now fetches the user from the database and compares the provided password with the stored hashed password using bcrypt.

4. We've added callbacks to ensure the user's ID is properly handled in the JWT and session:
   ```typescript
   callbacks: {
     async jwt({ token, user }) {
       if (user) {
         token.id = user.id;
       }
       return token;
     },
     async session({ session, token }) {
       if (session.user) {
         session.user.id = token.id as string;
       }
       return session;
     },
   },
   ```
   These callbacks ensure that the user's ID is included in the JWT token and the session object.

With these changes, your Next.js application now has a fully functional credentials authentication system that works with your MongoDB database. The `getUserByEmail` function retrieves the user from the database, and the `authorize` function in the `CredentialsProvider` uses this to validate the user's credentials.

Remember to ensure that your MongoDB connection string is properly set in your environment variables (MONGODB_URI).

Is there anything else you'd like me to explain or implement regarding the authentication system?
