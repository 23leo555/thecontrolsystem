/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Wejście główne "/" → 308 na /system (sekcja 4 briefu).
      { source: "/", destination: "/system", permanent: true },
    ];
  },
};

export default nextConfig;
