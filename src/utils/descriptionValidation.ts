import { countWords } from "./petUtils";

export const MAX_LISTING_DESCRIPTION_WORDS = 300;
export const MAX_LISTING_DESCRIPTION_CHARACTERS = 3000;

export function limitListingDescriptionWords(value: string): string {
  const words = [...value.matchAll(/\S+/g)];
  if (words.length <= MAX_LISTING_DESCRIPTION_WORDS) return value;
  const lastAllowedWord = words[MAX_LISTING_DESCRIPTION_WORDS - 1];
  return value.slice(0, (lastAllowedWord.index ?? 0) + lastAllowedWord[0].length);
}

export function getListingDescriptionError(value: string): string | null {
  const words = countWords(value);
  if (words > MAX_LISTING_DESCRIPTION_WORDS) {
    return `Description must be 300 words or fewer (you wrote ${words}).`;
  }
  if (value.length > MAX_LISTING_DESCRIPTION_CHARACTERS) {
    return `Description must be 3,000 characters or fewer (you wrote ${value.length}).`;
  }
  return null;
}

export function getDescriptionErrorFromMessage(message: string): string | null {
  return message.match(/(?:^|\n)description:\s*(.+)/i)?.[1] ?? null;
}
