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

      // TYMCZASOWE: brief wymaga /apply, ale lejek aplikacji jest wciąż pod
      // /aplikacja (przebudowa wg sekcji T-AA to osobny etap). Redirect zachowuje
      // query, więc cta_placement i UTM-y nie giną. Usunąć po przeniesieniu trasy.
      { source: "/apply", destination: "/aplikacja", permanent: false },
    ];
  },
};

export default nextConfig;
