import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Halaman tidak ditemukan</h1>
        <p style={{ color: "#71817a", marginBottom: 16 }}>
          Halaman yang Anda cari tidak tersedia pada ELMS Pesantren.
        </p>
        <Link className="button button-primary" href="/login">
          Kembali ke halaman masuk
        </Link>
      </div>
    </main>
  );
}
