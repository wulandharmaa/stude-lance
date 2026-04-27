/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Terapkan CORS ke semua endpoint API
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // Izinkan akses spesifik dari Frontend kamu (Port 3000)
          { key: "Access-Control-Allow-Origin", value: "http://localhost:3000" }, 
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