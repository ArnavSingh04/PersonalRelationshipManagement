import type { Contact, PersonalFact } from "./types";

export type DraftInput = {
  contact: Contact;
  facts: PersonalFact[]; // only the facts the user selected (sensitive excluded upstream by default)
  reason: string;
  tone: string;
  length: "short" | "medium" | "long";
};

function firstName(contact: Contact): string {
  return (contact.preferred_name || contact.full_name).trim().split(/\s+/)[0];
}

function factPhrase(facts: PersonalFact[]): string | null {
  if (facts.length === 0) return null;
  const f = facts[0];
  return f.value;
}

function greeting(tone: string, name: string): string {
  switch (tone) {
    case "professional":
      return `Hi ${name},`;
    case "casual":
      return `Hey ${name}!`;
    case "grateful":
      return `Hey ${name},`;
    default:
      return `Hey ${name},`;
  }
}

/**
 * Template-based message generation per PRD sections 12 and 17.
 * Never invents facts: only uses how_i_know_them, relationship_context,
 * and the facts explicitly passed in.
 */
export function generateDraft(input: DraftInput): string {
  const { contact, facts, reason, tone, length } = input;
  const name = firstName(contact);
  const howMet = contact.how_i_know_them?.trim();
  const context = factPhrase(facts) ?? contact.relationship_context?.trim() ?? null;
  const hi = greeting(tone, name);

  let body: string;

  switch (reason) {
    case "linkedin_request": {
      const met = howMet ? ` after ${howMet}` : "";
      const ctx = context ? ` I enjoyed learning about ${context} and` : " I";
      body = `Hey ${name}, great connecting${met}.${ctx} would love to stay in touch here.`;
      // LinkedIn connection notes must stay short regardless of length setting.
      return body;
    }
    case "linkedin_accepted": {
      const ctx = context ? ` I enjoyed learning about ${context}.` : "";
      body = `${hi} thanks for connecting.${ctx} Looking forward to staying in touch.`;
      break;
    }
    case "birthday": {
      body = `Happy birthday, ${name}! Hope you have a great day and an even better year ahead.`;
      if (length !== "short" && context) {
        body += ` Also hope things are going well with ${context}.`;
      }
      return body;
    }
    case "check_in": {
      if (context) {
        body = `${hi} hope you’ve been doing well. I remembered ${context} and wanted to check in — how’s that going?`;
      } else {
        body = `${hi} hope you’ve been doing well. It’s been a little while, so I wanted to check in — how have things been?`;
      }
      break;
    }
    case "reconnect": {
      if (context) {
        body = `${hi} it’s been a while. I was revisiting my notes and remembered our conversation about ${context}. Hope you’ve been doing well — would be nice to catch up sometime.`;
      } else {
        body = `${hi} it’s been a while since we last spoke. Hope you’ve been doing well — would be nice to catch up sometime.`;
      }
      break;
    }
    case "thank_you": {
      const ctx = context ? ` — especially around ${context}` : "";
      body = `${hi} I just wanted to say thank you for your time and help${ctx}. It genuinely meant a lot.`;
      break;
    }
    case "congrats": {
      const ctx = context ? ` on ${context}` : " on the great news";
      body = `${hi} congratulations${ctx}! Really happy for you — well deserved.`;
      break;
    }
    case "follow_up":
    default: {
      if (context) {
        body = `${hi} following up on our last conversation about ${context}. How have things been progressing on your side?`;
      } else {
        body = `${hi} just following up on our last conversation. How have things been on your side?`;
      }
      break;
    }
  }

  if (length === "long") {
    const extraFacts = facts.slice(1, 3);
    if (extraFacts.length > 0) {
      const extras = extraFacts.map((f) => f.value).join(", and ");
      body += ` Also curious how things are going with ${extras}.`;
    }
    if (tone === "warm" || tone === "casual") {
      body += ` Would be great to catch up properly sometime soon.`;
    }
  }

  if (tone === "concise" || length === "short") {
    // Keep only the first two sentences for concise output.
    const sentences = body.match(/[^.!?]+[.!?]+/g) ?? [body];
    body = sentences.slice(0, 2).join(" ").trim();
  }

  return body;
}

/** wa.me click-to-chat link with prefilled text. */
export function whatsappLink(phone: string | null, text: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(email: string | null, subject: string, body: string): string | null {
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
