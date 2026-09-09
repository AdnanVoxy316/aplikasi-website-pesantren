import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Batas body Server Action — harus lebih besar dari ukuran file maksimum
    // (10 MB) untuk menampung overhead encoding multipart/form-data.
    serverActions: {
      bodySizeLimit: "12mb",
    },
    // proxy.ts aktif di /santri, /guru, /wali — Next 16 mem-buffer body
    // permintaan di proxy dengan default 10 MB. Naikkan agar upload 10 MB
    // tidak terpotong sebelum sampai ke Server Action.
    proxyClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
