import React from "react";
import Header from "../Header";
import Hero from "../Hero";
import Features from "../Features";
import LanguageCards from "../LanguageCards";
import Leaderboard from "../Leaderboard";

import Footer from "../Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <LanguageCards />
  
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
