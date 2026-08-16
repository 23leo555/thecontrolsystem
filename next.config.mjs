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

      // Kod QR na końcu PDF-a z Protokołem koduje ten adres — to jedyny link
      // wewnątrz dokumentu i jedyne, co jeszcze kieruje na /aplikacja (poza
      // starą stroną /rozmowa). Właściciel zdecydował 2026-08-16, że ma
      // prowadzić do materiału VSL, a nie do nieużywanego już lejka.
      //
      // Przekierowanie zamiast poprawiania PDF-a: dokumentu nie da się zmienić
      // bez dostępu do źródła, a kopie już rozesłane mailem i tak niosą stary
      // adres. Celowo NIEtrwałe (307) — gdy powstanie nowa wersja dokumentu
      // z właściwym linkiem, trwałe przekierowanie zostałoby w cache przeglądarek.
      { source: "/aplikacja", destination: "/#krok-1", permanent: false },
    ];
  },
};

export default nextConfig;
