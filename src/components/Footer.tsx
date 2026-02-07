import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-removebg-preview.png";

export const Footer = () => {
  const { locale, t } = useLanguage();

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-sm text-muted-foreground">
          {t.footer.copyright.replace(
            "{year}",
            new Date().getFullYear().toString(),
          )}
        </div>
        <div className="text-center text-sm text-muted-foreground pt-2">
          {t.footer.madeBy}{" "}
          <a
            href="https://pakhlavon.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            pakhlavon.dev
          </a>{" "}
          &{" "}
          <a
            href="https://mukhsinus.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            mukhsinus.dev
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
