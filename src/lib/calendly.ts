/**
 * Pomocniki do payloadu webhooka Calendly (AA3).
 *
 * Osobny moduł, bo pliki tras Next.js mogą eksportować wyłącznie handlery
 * i konfigurację — funkcja pomocnicza wyeksportowana z `route.ts` wywraca
 * sprawdzanie typów przy budowaniu.
 */

/**
 * URI zaproszenia ma postać `.../scheduled_events/<uuid>/invitees/<uuid>`,
 * a rezerwacje trzymamy pod URI samego wydarzenia. Odcinamy więc końcówkę.
 * Zwraca null dla pustej albo nieoczekiwanej wartości — webhook nie może
 * wywrócić się na polu, którego Calendly akurat nie przysłał.
 */
export function eventUriFromInvitee(inviteeUri: string | null | undefined): string | null {
  if (!inviteeUri) return null;
  const [eventUri] = inviteeUri.split("/invitees/");
  return eventUri && eventUri !== inviteeUri ? eventUri : null;
}
