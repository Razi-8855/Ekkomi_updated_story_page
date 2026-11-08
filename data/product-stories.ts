export type ProductStory = {
  colour: string;
  coreStatement: string;
  description: string;
  interpretation: string;
  visualDirection: string[];
};

/** Editorial copy supplied for the five EKKOMI jacket styles. */
export const productStories: Record<string, ProductStory> = {
  audacity: {
    colour: "Mustard yellow",
    coreStatement: "Be bold enough to claim what you want.",
    description:
      "Audacity is the willingness to move before the world has decided you may. The deep mustard suede refuses anonymity, while tonal embroidery keeps that boldness controlled and intricate. A piece that stands apart without turning difference into performance.",
    interpretation:
      "Audacity should feel expansive, assured and composed. The power is in having nothing to prove.",
    visualDirection: [
      "Central placement and visual authority.",
      "Unconventional but controlled poses.",
      "Strong architecture and occupying space comfortably.",
    ],
  },
  insolence: {
    colour: "Jet black",
    coreStatement: "Respect is earned. Obedience is optional.",
    description:
      "Insolence is not rejection for its own sake. It is the confidence to decide which rules deserve respect and which have simply become habits of obedience. In black suede, near-concealed embroidery turns restraint into something more subversive. Refined, controlled and entirely capable of disobedience.",
    interpretation:
      "Insolence should feel knowing, controlled and faintly provocative. This is cultivated disobedience.",
    visualDirection: [
      "Formal settings with one subtle disruption.",
      "Relaxed body language and direct eye contact.",
      "Black-on-black detail revealed by light; order interrupted slightly.",
    ],
  },
  desire: {
    colour: "Red",
    coreStatement: "Wanting more is not greed. It is ambition.",
    description:
      "Desire begins with recognising what could be — and turning that recognition into intent. Rendered in deep red suede, the jacket balances appetite with restraint. Tonal embroidery appears in fragments as light catches the surface, then recedes again. Sensual without spectacle. Expressive without excess.",
    interpretation:
      "Desire should feel focused, magnetic and assured. The idea is desire as something that drives goals.",
    visualDirection: [
      "Deliberate movement and a forward gaze.",
      "Tension between distance and possession.",
      "Controlled environments, with light revealing embroidery in fragments.",
    ],
  },
  curiosity: {
    colour: "Navy",
    coreStatement: "Follow what intrigues you.",
    description:
      "Curiosity refuses the comfort of the known. It looks twice, asks another question, notices what others pass by. In deep navy suede leather, tonal embroidery behaves the same way — receding at first glance, then revealing more as light moves across it. Made for those who would rather discover than simply be shown.",
    interpretation:
      "Curiosity should feel observant, intelligent and searching. This is adult curiosity: discerning, restless, unsatisfied by the obvious.",
    visualDirection: [
      "Partial revelation and details discovered on a second look.",
      "Reflections, thresholds and corridors.",
      "Movement toward something unknown.",
    ],
  },
  temptation: {
    colour: "Olive green",
    coreStatement: "Choose more than what you are given.",
    description:
      "Temptation begins when another possibility enters view and becomes difficult to ignore. In forest green suede, embroidery shifts between shadow and visibility, revealing itself gradually rather than giving everything away. A piece for the possibility that refuses to leave quietly.",
    interpretation:
      "Temptation should feel magnetic, restrained and unresolved. The idea is possibility, not vice.",
    visualDirection: [
      "Proximity without contact and glances.",
      "Something just out of reach.",
      "Choices, thresholds and shadow.",
    ],
  },
};

export const productTaglines: Record<string, string> = {
  curiosity: "The room was loud. The impulse was quiet. Curiosity doesn’t ask for permission.",
  temptation: "You knew where the line was. You stepped across it on purpose.",
  desire: "Wanting more is not greed. Sometimes it is vision.",
  audacity: "Confidence before permission arrives.",
  insolence: "The rules were written by people who wanted you to stay quiet.",
};
