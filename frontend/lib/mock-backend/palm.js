// Mock palm reading content. Replace with the real AI/backend response later;
// keep the shape returned by lib/api/palm.js stable so the UI does not change.

const SHARED = {
  handShape: {
    name: 'Air hand',
    description: 'A square palm with long fingers: curious, articulate, and quick to weigh an idea before trusting it.',
  },
  lines: {
    life: {
      title: 'Life Line',
      summary: 'Deep and steady, curving widely around the thumb. It speaks of resilience and a body that recovers well from long seasons.',
    },
    heart: {
      title: 'Heart Line',
      summary: 'Long and gently curved, ending beneath the first finger. Affection is given freely, though only after trust is earned.',
    },
    head: {
      title: 'Head Line',
      summary: 'Clear and slightly sloped, showing a mind that balances logic with imagination and returns often to creative work.',
    },
    fate: {
      title: 'Fate Line',
      summary: 'Faint at its start and firmer toward the middle. Direction arrives late, but once found it holds.',
    },
  },
};

const BY_HAND = {
  left: {
    interpretation:
      'The left hand is read as what you were born with. Here it shows a patient, observant nature that prefers to understand a thing fully before acting on it. Your gifts lean toward thought and care, and your quiet persistence is a stronger asset than it feels. The year ahead favours finishing what is already begun.',
  },
  right: {
    interpretation:
      'The right hand is read as what you have made of yourself. Here it shows a person who has grown more decisive than the early lines promised. Discipline is turning talent into something durable, and the clearest lines point toward steady, creative work. Trust the direction you have already chosen and let it deepen.',
  },
};

export function buildMockPalmReading({ hand }) {
  const key = hand === 'left' ? 'left' : 'right';
  return {
    id: `mock-palm-${Date.now()}`,
    hand: key,
    createdAt: new Date().toISOString(),
    ...SHARED,
    interpretation: BY_HAND[key].interpretation,
  };
}
