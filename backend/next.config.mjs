/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Gunakan Environment Variable agar dinamis. 
    // Jika di Vercel akan membaca FRONTEND_URL, jika di laptop (local) akan pakai localhost.
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

    return [
      {
        // Terapkan CORS ke semua endpoint API
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // Izinkan akses dinamis (Production vs Local)
          { key: "Access-Control-Allow-Origin", value: allowedOrigin }, 
          // Izinkan metode HTTP yang dibutuhkan
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          // Izinkan header yang biasa dikirim oleh Axios/Frontend
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
