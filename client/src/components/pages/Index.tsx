import React from "react";
import Header from "../Header";
import Hero from "../Hero";
import Features from "../Features";
import LanguageGrid from "../LanguageGrid";
import Leaderboard from "../Leaderboard";
import Testimonials from "../Testimonials";
import Footer from "../Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Features />
        <LanguageGrid />
        <Leaderboard />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
