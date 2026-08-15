/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Brief v1.0 (sekcja I1): landing stoi pod "/". Stary adres /system
      // przekierowujemy, żeby nie zgubić linków do poprzedniej wersji strony.
      { source: "/system", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
