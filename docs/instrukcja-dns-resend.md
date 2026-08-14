# Rekordy DNS do dodania — thecontrolsystem.biz

Cześć,

potrzebuję dodania **trzech rekordów DNS** dla domeny `thecontrolsystem.biz`.
Rekordy uruchamiają wysyłkę wiadomości systemowych ze strony (Resend).

DNS domeny jest hostowany w **Squarespace** (nameservery `nsd1–nsd4.squarespacedns.com`).

---

## ⚠️ Najważniejsze: nie ruszamy istniejących rekordów

Na domenie działa poczta Google Workspace:

```
MX   thecontrolsystem.biz  →  smtp.google.com
TXT  thecontrolsystem.biz  →  v=spf1 include:_spf.google.com ~all
```

**Tych dwóch rekordów nie wolno usuwać ani edytować.**

Wszystkie trzy nowe rekordy mają **wypełnione pole Host** (`resend._domainkey` albo `send`).
Pole Host nigdy nie może być puste ani zawierać `@`.

> Gdyby rekord MX trafił na główną domenę (pusty Host), nadpisze `smtp.google.com`
> i **poczta przestanie przychodzić**. To jedyny nieodwracalny błąd w tej operacji.

---

## Gdzie dodać

1. [account.squarespace.com](https://account.squarespace.com) → zaloguj się
2. **Domains** → `thecontrolsystem.biz`
3. **DNS** → **DNS Settings**
4. Sekcja **Custom Records** → **Add Record**

---

## Rekord 1 — TXT (DKIM)

| Pole | Wartość |
|---|---|
| **Type** | `TXT` |
| **Host** | `resend._domainkey` |

**Data** — skopiować w całości, jednym ciągiem, bez spacji i bez łamania linii:

```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg+lE1l5Zk0LNwwaVaEkQtt1dSuHEfCpywO0LCYf6wsK4JQjLSgVe04zHI0Mtb68/QTRUoGfLttM9I7I2Egzi3zed2oBFN+me9qxXNKV+glvnDpkTyJuufXdprmoL1sZYRG3smYAaWBt4eIOomWLzDqb6gQSQvmFuoltr+92zLrwIDAQAB
```

---

## Rekord 2 — MX

| Pole | Wartość |
|---|---|
| **Type** | `MX` |
| **Host** | `send` |
| **Priority** | `10` |
| **Data** | `feedback-smtp.eu-west-1.amazonses.com` |

---

## Rekord 3 — TXT (SPF dla subdomeny)

| Pole | Wartość |
|---|---|
| **Type** | `TXT` |
| **Host** | `send` |
| **Data** | `v=spf1 include:amazonses.com ~all` |

Ten SPF dotyczy **wyłącznie subdomeny `send`**. SPF na głównej domenie
(ten od Google) zostaje bez zmian — nie mogą istnieć dwa rekordy SPF na tym samym hoście.

---

## Uwaga o Squarespace

Squarespace bywa, że sam dopisuje nazwę domeny na końcu pola Host.
To normalne — ale trzeba sprawdzić, czy nie powstało coś takiego:

```
send.thecontrolsystem.biz.thecontrolsystem.biz   ← błąd, podwójnie
```

Jeśli tak, w polu Host wpisać samo `send`.

---

## Po dodaniu

Daj proszę znać — zweryfikujemy po naszej stronie, czy rekordy są widoczne
i czy wysyłka działa. Sprawdzimy też, czy poczta Google działa bez zmian.

Propagacja DNS zwykle trwa 15–30 minut, czasem do kilku godzin.

Dzięki!
