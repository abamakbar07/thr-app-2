import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** MongoDB ObjectId as string */
      id: string;
      _id: string;
      name: string;
      email: string;
      role: string;
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    /** MongoDB ObjectId as string */
    id: string;
    _id: string;
    name: string;
    email: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** MongoDB ObjectId as string */
    id: string;
    _id: string;
    name: string;
    email: string;
    role?: string;
  }
} 