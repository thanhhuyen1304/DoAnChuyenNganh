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
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_ID !== '' && process.env.GOOGLE_CLIENT_SECRET !== '') {
    // Cho phép override callback URL theo provider qua env riêng
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${SERVER_URL}/api/auth/google/callback`;
    
    console.log('✅ Google OAuth Strategy initialized');
    
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL
            },
            async (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: any) => {
                try {
                    let user = await User.findOne({ 'oauth.google': profile.id });

                    if (!user && profile.emails && profile.photos) {
                        // Check if email already exists
                        const existingUser = await User.findOne({ email: profile.emails[0].value });
                        
                        if (existingUser) {
                            // Update existing user with OAuth info
                            existingUser.oauth.google = profile.id;
                            existingUser.loginMethod = 'google';
                            if (profile.photos && profile.photos[0] && !existingUser.avatar) {
                                existingUser.avatar = profile.photos[0].value;
                            }
                            await existingUser.save();
                            return done(null, existingUser);
                        } else {
                            // Create new user
                            user = await User.create({
                                email: profile.emails[0].value,
                                username: `user_${profile.id}`,
                                oauth: { google: profile.id },
                                avatar: profile.photos[0].value,
                                password: Math.random().toString(36).slice(-8),
                                loginMethod: 'google'
                            });
                        }
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
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.GITHUB_CLIENT_ID !== '' && process.env.GITHUB_CLIENT_SECRET !== '') {
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || `${SERVER_URL}/api/auth/github/callback`;
    
    console.log('✅ GitHub OAuth Strategy initialized');
    console.log('GitHub Config:', {
        clientID: process.env.GITHUB_CLIENT_ID?.substring(0, 10) + '...',
        callbackURL: GITHUB_CALLBACK_URL
    });
    
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                callbackURL: GITHUB_CALLBACK_URL,
                authorizationURL: 'https://github.com/login/oauth/authorize',
                tokenURL: 'https://github.com/login/oauth/access_token',
                userProfileURL: 'https://api.github.com/user'
            },
            async (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: any) => {
                try {
                    console.log('GitHub OAuth callback - Profile:', {
                        id: profile.id,
                        username: profile.username,
                        hasEmails: !!profile.emails,
                        hasPhotos: !!profile.photos
                    });
                    
                    let user = await User.findOne({ 'oauth.github': profile.id });

                    if (!user && profile.emails && profile.photos) {
                        // Check if email already exists
                        const existingUser = await User.findOne({ email: profile.emails[0].value });
                        
                        if (existingUser) {
                            // Update existing user with OAuth info
                            existingUser.oauth.github = profile.id;
                            existingUser.loginMethod = 'github';
                            if (profile.photos && profile.photos[0] && !existingUser.avatar) {
                                existingUser.avatar = profile.photos[0].value;
                            }
                            await existingUser.save();
                            return done(null, existingUser);
                        } else {
                            // Create new user
                            user = await User.create({
                                email: profile.emails[0].value,
                                username: profile.username || `user_${profile.id}`,
                                oauth: { github: profile.id },
                                avatar: profile.photos[0].value,
                                password: Math.random().toString(36).slice(-8),
                                loginMethod: 'github'
                            });
                        }
                    }

                    console.log('GitHub OAuth - User found/created:', user ? user.email : 'none');
                    return done(null, user);
                } catch (error) {
                    console.error('GitHub OAuth Strategy Error:', error);
                    console.error('Error details:', error);
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

// Facebook Strategy (chỉ khởi tạo nếu có credentials)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && process.env.FACEBOOK_APP_ID !== '' && process.env.FACEBOOK_APP_SECRET !== '') {
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || `${SERVER_URL}/api/auth/facebook/callback`;
    
    passport.use(
        new FacebookStrategy(
            {
                clientID: process.env.FACEBOOK_APP_ID,
                clientSecret: process.env.FACEBOOK_APP_SECRET,
                callbackURL: FACEBOOK_CALLBACK_URL,
                profileFields: ['id', 'emails', 'name', 'picture']
            },
            async (_accessToken: string, _refreshToken: string, profile: FacebookProfile, done: any) => {
                try {
                    // Facebook thường không trả email nếu app chưa live hoặc user ẩn email
                    const email = (profile.emails && profile.emails[0] && profile.emails[0].value)
                        ? profile.emails[0].value
                        : `${profile.id}@facebook.local`;

                    const avatarUrl = (profile.photos && profile.photos[0] && profile.photos[0].value)
                        ? profile.photos[0].value
                        : '';

                    // Ưu tiên tìm theo oauth.facebook, sau đó fallback theo email
                    let user = await User.findOne({ 'oauth.facebook': profile.id });
                    if (!user) {
                        user = await User.findOne({ email });
                    }

                    if (user) {
                        // Cập nhật liên kết OAuth nếu thiếu
                        if (!user.oauth) {
                            user.oauth = {} as any;
                        }
                        user.oauth.facebook = profile.id;
                        user.loginMethod = 'facebook';
                        if (avatarUrl && !user.avatar) {
                            user.avatar = avatarUrl;
                        }
                        await user.save();
                        return done(null, user);
                    }

                    // Tạo mới user nếu chưa tồn tại
                    const created = await User.create({
                        email,
                        username: `user_${profile.id}`,
                        oauth: { facebook: profile.id },
                        avatar: avatarUrl,
                        password: Math.random().toString(36).slice(-8),
                        loginMethod: 'facebook'
                    });

                    return done(null, created);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}