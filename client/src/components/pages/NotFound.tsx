import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-4xl font-bold text-foreground">Oops! Page not found</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="bg-gradient-primary hover:shadow-glow">
          <a href="/">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
