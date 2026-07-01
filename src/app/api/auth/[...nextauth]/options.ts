import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import bcrypt from "bcryptjs";
import { signInSchema } from "@/validations/auth.validation";

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any): Promise<any> {
                const validationResult = signInSchema.safeParse({
                    email: credentials?.email,
                    password: credentials?.password
                });

                if (!validationResult.success) {
                    throw new Error(validationResult.error.issues[0]?.message || "Invalid input format");
                }

                const { email, password } = validationResult.data;

                await dbConnect();

                const user = await UserModel.findOne({ email });

                if (!user) {
                    throw new Error("No account found with this email");
                }

                if (user.provider !== "email" || !user.passwordHash) {
                    throw new Error(`This email is registered with ${user.provider}. Please log in using that provider.`);
                }

                const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
                if (!isPasswordCorrect) {
                    throw new Error("Incorrect password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.avatar,
                    isEmailVerified: true
                };
            }
        })
    ],
    pages: {
        signIn: "/sign-in"
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.isEmailVerified = user.isEmailVerified;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.isEmailVerified = token.isEmailVerified as boolean
            }
            return session;
        },
        async signIn({user, account, profile}){
            if(account?.provider === "credentials"){
                return true;
            }

            await dbConnect();

            try {
                
                let dbUser = await UserModel.findOne({email: user.email});

                if(!dbUser){
                    dbUser = await UserModel.create({
                        name: user.name || "User",
                        email: user.email as string,
                        provider: account?.provider as "google" | "github",
                        avatar: user.image || null,
                        isEmailVerified: true,
                        passwordHash: null
                    });
                }
                else{
                    dbUser.name = user.name || dbUser.name;
                    dbUser.avatar = user.image || dbUser.avatar;
                    await dbUser.save()
                }

                user.id = dbUser._id.toString();
                user.isEmailVerified = dbUser.isEmailVerified;

                return true;

            } catch (err) {
                console.error("Error in OAuth signIn callback:", err);
                return false;
            }
        }   
    }
}
