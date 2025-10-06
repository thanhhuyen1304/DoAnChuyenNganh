import React from "react";
import { Facebook, Twitter, Linkedin, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { labelKey: "nav.courses", href: "#courses" },
      { labelKey: "nav.challenges", href: "#challenges" },
      { labelKey: "nav.leaderboard", href: "#leaderboard" },
      { labelKey: "footer.pricing", href: "#pricing" },
    ],
    company: [
      { labelKey: "footer.about", href: "#about" },
      { labelKey: "nav.blog", href: "#blog" },
      { labelKey: "footer.careers", href: "#careers" },
      { labelKey: "footer.contact", href: "#contact" },
    ],
    legal: [
      { labelKey: "footer.terms", href: "#terms" },
      { labelKey: "footer.privacy", href: "#privacy" },
      { labelKey: "footer.cookies", href: "#cookies" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-secondary/50 border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                <span className="text-2xl font-bold font-code">🐛</span>
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BugHunter
              </span>
            </a>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:contact@bughunter.dev" className="hover:text-primary transition-colors">
                  contact@bughunter.dev
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href="tel:+84123456789" className="hover:text-primary transition-colors">
                  +84 123 456 789
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Hà Nội, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.product")}</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.company")}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.legal")}</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} BugHunter. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-secondary hover:bg-gradient-primary flex items-center justify-center transition-all duration-300 hover:shadow-glow hover:scale-110 group"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
