import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import User, { IUser } from '../models/user.model';

// JWT Strategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
};

interface JwtPayload {
    userId: string;
}

passport.use(
    new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
        try {
            const user = await User.findById(payload.userId);
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

// Google Strategy (chỉ khởi tạo nếu có credentials)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback'
            },
            async (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: any) => {
                try {
                    let user = await User.findOne({ 'oauth.google': profile.id });

                    if (!user && profile.emails && profile.photos) {
                        user = await User.create({
                            email: profile.emails[0].value,
                            username: `user_${profile.id}`,
                            oauth: { google: profile.id },
                            avatar: profile.photos[0].value,
                            password: Math.random().toString(36).slice(-8) // Tạo mật khẩu ngẫu nhiên
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

// GitHub Strategy (chỉ khởi tạo nếu có credentials)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: '/api/auth/github/callback'
            },
            async (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: any) => {
                try {
                    let user = await User.findOne({ 'oauth.github': profile.id });

                    if (!user && profile.emails && profile.photos) {
                        user = await User.create({
                            email: profile.emails[0].value,
                            username: profile.username || `user_${profile.id}`,
                            oauth: { github: profile.id },
                            avatar: profile.photos[0].value,
                            password: Math.random().toString(36).slice(-8)
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

// Facebook Strategy (chỉ khởi tạo nếu có credentials)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
        new FacebookStrategy(
            {
                clientID: process.env.FACEBOOK_APP_ID,
                clientSecret: process.env.FACEBOOK_APP_SECRET,
                callbackURL: '/api/auth/facebook/callback',
                profileFields: ['id', 'emails', 'name', 'picture']
            },
            async (_accessToken: string, _refreshToken: string, profile: FacebookProfile, done: any) => {
                try {
                    let user = await User.findOne({ 'oauth.facebook': profile.id });

                    if (!user && profile.emails && profile.photos) {
                        user = await User.create({
                            email: profile.emails[0].value,
                            username: `user_${profile.id}`,
                            oauth: { facebook: profile.id },
                            avatar: profile.photos[0].value,
                            password: Math.random().toString(36).slice(-8)
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}