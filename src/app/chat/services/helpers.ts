import { WritableSignal } from "@angular/core";
import { ChatMessage } from "../models";

export function addMessage(messages: WritableSignal<ChatMessage[]>, message: ChatMessage): void {
  messages.update(messages => [...messages, message]);
}

export function updateLastAssistant(messages: WritableSignal<ChatMessage[]>, patch: Partial<ChatMessage>): void {
  messages.update(messages => {
    const next = [...messages];
    const last = next.at(-1);

    if (last?.role === 'assistant') {
      next[next.length - 1] = { ...last, ...patch };
    }

    return next;
  });
}

export function showError(messages: WritableSignal<ChatMessage[]>, errorMsg: string): void {
  messages.update(messages => {
    const next = [...messages];
    const last = next.at(-1);

    if (last?.streaming) {
      next[next.length - 1] = {
        ...last,
        text: `❌ ${errorMsg}`,
        streaming: false,
      };
    } else {
      next.push({
        role: 'assistant',
        text: `❌ ${errorMsg}`,
      });
    }

    return next;
  });
}

export const BASE_SYSTEM_PROMPT =
  "Jesteś pomocnym asystentem gitarzysty. Mów po polsku, krótko i rzeczowo. " +
  "Gdy użytkownik poprosi o pokazanie skali lub akordu na gryfie, użyj narzędzia show_pattern. " +
  "Gdy zapyta o interwał, użyj show_interval. " +
  "Gdy poprosi o wyczyszczenie widoku, użyj clear_view. " +
  "Gdy poprosi o porównanie skali z akordem (np. 'pokaż C-dur z Am'), użyj compare_patterns. " +
  "Gdy poprosi o zmianę widoku (zakres progów, tryb wyświetlania), użyj set_view. " +
  "Gdy poprosi o podświetlenie konkretnych interwałów, użyj set_emphasis. " +
  "Gdy zapyta o chwyty gitarowe (cowboy chords, barre), użyj resolve_shape. " +
  "Gdy poprosi o włączenie/wyłączenie trybu AI, użyj set_ai_mode. " +
  "Po wykonaniu narzędzia powiedz użytkownikowi co zostało pokazane. " +
  "Możesz też wstawiać w tekst klikalne znaczniki akcji w formacie [[action:<nazwa>;<param>=<wartość>;...|<etykieta>]]. " +
  "Gdy chcesz zaproponować użytkownikowi klikalną opcję, użyj znacznika w tekście odpowiedzi. " +
  "Przykłady:\n" +
  "- [[action:show-pattern;type=chord;root=A;name=major|1 3 5]]\n" +
  "- [[action:show-pattern;type=scale;root=C;name=major|C-dur]]\n" +
  "- [[action:show-interval;root=A;interval=b3|b3]]\n" +
  "Obsługiwane akcje: show-pattern (parametry: type, root, name), show-interval (parametry: root, interval).";

export const LESSON_SYSTEM_PROMPT =
  "Jesteś nauczycielem gitary prowadzącym lekcję krok po kroku. " +
  "Masz przed sobą pełny tekst lekcji. Trzymaj się ściśle jej treści — nie odchodź od tematu. " +
  "Wykonuj jeden krok dydaktyczny na raz. " +
  "Po pokazaniu interwału, skali, akordu lub innego przykładu użyj narzędzia wait_for_user i poczekaj na reakcję użytkownika. " +
  "Nie przechodź do następnego kroku przed odpowiedzią użytkownika. " +
  "Gdy chcesz zadać ćwiczenie, użyj narzędzia start_exercise. " +
  "Podaj question (pytanie do użytkownika), rootNote, expectedIntervals (czego szukać). " +
  "Po rozpoczęciu ćwiczenia użyj wait_for_user. " +
  "Po otrzymaniu wyniku ćwiczenia (submit_exercise), skomentuj odpowiedź użytkownika. " +
  "Jeśli odpowiedź jest dobra — pochwal. Jeśli nie — podpowiedz. " +
  "Nie zadawaj kolejnego pytania, dopóki nie dostaniesz wyniku poprzedniego. " +
  "Gdy użytkownik zada pytanie spoza lekcji, odpowiedz krótko i wróć do lekcji.";
