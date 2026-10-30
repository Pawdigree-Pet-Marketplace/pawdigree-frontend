import { Bird, Cat, Dog, Fish, Rabbit, type LucideIcon } from "lucide-react";
import type { SpeciesKey } from "../../data/pets";

export const SPECIES_ICON: Record<SpeciesKey, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  rabbit: Rabbit,
  bird: Bird,
  fish: Fish,
};
