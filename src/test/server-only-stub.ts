/**
 * Atrapa pakietu `server-only` na potrzeby vitest.
 *
 * Prawdziwy `server-only` celowo rzuca wyjątkiem przy imporcie, żeby moduł
 * serwerowy nie mógł trafić do bundla klienta. W testach jednostkowych nie ma
 * tego rozróżnienia, więc podmieniamy go aliasem w vitest.config.ts.
 *
 * Ochrona w produkcyjnym builcie Next.js pozostaje nienaruszona.
 */
export {};
