import React from "react";
import { Button } from "./ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";

const Hero = () => {
  const { t } = useLanguage();
  
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden animate-fade-in">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-block animate-scale-in">
              <span className="px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow">
                {t("hero.badge")}
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              {t("hero.title1")}{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: "var(--gradient-primary)" }}>
                {t("hero.title2")}
              </span>{" "}
              {t("hero.title3")}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              {t("hero.description")}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300 group hover:scale-105"
              >
                {t("hero.cta")}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 hover:scale-105 transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                {t("hero.demo")}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="group">
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  500+
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t("hero.stat1")}
                </div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  10K+
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t("hero.stat2")}
                </div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  5+
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t("hero.stat3")}
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative rounded-2xl shadow-elegant w-full h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-float group-hover:shadow-glow transition-all duration-500">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">🐛</div>
                <div className="text-lg font-medium">Code Debugging</div>
                <div className="text-sm">Master the art of debugging</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
