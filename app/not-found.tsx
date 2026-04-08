import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p
        style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: "1.5rem",
          color: "var(--text-secondary)",
          marginBottom: "2rem",
        }}
      >
        This page doesn&apos;t exist.
      </p>
      <Link href="/" className="back-link" style={{ justifyContent: "center" }}>
        ← Return home
      </Link>
    </div>
  );
}
