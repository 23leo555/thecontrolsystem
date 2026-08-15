import { describe, expect, it } from "vitest";
import { eventUriFromInvitee } from "@/lib/calendly";

/**
 * Przełożenie terminu wiąże stare zaproszenie z nowym przez `old_invitee`,
 * a rezerwacje trzymamy pod URI wydarzenia. Błąd w tym przycinaniu oznacza
 * pustą historię przełożeń — i nie widać go inaczej niż na żywym webhooku.
 */
describe("eventUriFromInvitee", () => {
  const event = "https://api.calendly.com/scheduled_events/7bdf4300-ee06-44ee-ae41-32f34ad31f4a";

  it("odcina końcówkę /invitees/<uuid>", () => {
    expect(eventUriFromInvitee(`${event}/invitees/1c1e4b2a-0000-4000-8000-000000000000`)).toBe(event);
  });

  it("zwraca null dla braku wartości", () => {
    expect(eventUriFromInvitee(null)).toBeNull();
    expect(eventUriFromInvitee("")).toBeNull();
  });

  it("zwraca null, gdy URI nie jest zaproszeniem", () => {
    // Samo wydarzenie bez części /invitees/ nie niesie informacji o przełożeniu.
    expect(eventUriFromInvitee(event)).toBeNull();
  });
});
