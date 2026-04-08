import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Sameer Kashyap",
    default: "Sameer Kashyap — Research & Writing",
  },
  description:
    "Technical writing on machine learning, mathematics, and computer science. Implementations of papers with derivations, code, and intuition.",
  keywords: [
    "machine learning",
    "deep learning",
    "mathematics",
    "research",
    "transformers",
    "reinforcement learning",
  ],
  authors: [{ name: "Sameer Kashyap" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Sameer Kashyap",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@sameerkashyap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="/" className="site-name">
          Sameer Kashyap
        </a>
        <div className="header-divider">
          <span className="star-decoration">✦</span>
        </div>
        <p className="site-tagline">
          Research notes on machine learning, mathematics &amp; systems
        </p>
        <nav className="site-nav">
          <a href="/">Writing</a>
          <a href="https://github.com/sameerkashyap" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://twitter.com/sameerkashyap" target="_blank" rel="noopener noreferrer">Twitter</a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="footer-text">
          © {new Date().getFullYear()} Sameer Kashyap
        </p>
        <div className="footer-links">
          <a href="https://github.com/sameeerkashyap" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://twitter.com/sameeerkashyap" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
          <a href="mailto:sameera.s.kashyap@gmail.com">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
