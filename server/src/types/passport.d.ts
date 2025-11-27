declare module 'passport' {
  import { Request, Response, NextFunction } from 'express';
  
  interface AuthenticateOptions {
    session?: boolean;
    failureRedirect?: string;
    successRedirect?: string;
    failureFlash?: boolean | string | string[];
    successFlash?: boolean | string | string[];
  }

  function authenticate(strategy: string, options?: AuthenticateOptions): any;
  function initialize(): any;
  
  global {
    namespace Express {
      interface User {
        id?: string;
        email?: string;
        username?: string;
      }
    }
  }
  
  export = passport;
}