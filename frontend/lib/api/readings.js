import { MOCK_READINGS } from '../mock-backend/readings';
import { getMockUserId } from '../mock-backend/session';

const MOCK_DELAY = 150;

export const PRACTICE_META = {
  all:       { label: 'All',       icon: null      },
  tarot:     { label: 'Tarot',     icon: 'moon'    },
  palmistry: { label: 'Palm',      icon: 'hand'    },
  astrology: { label: 'Astrology', icon: 'sparkle' },
  dream:     { label: 'Dream',     icon: 'book'    },
  daily:     { label: 'Daily',     icon: 'sun'     },
};

function wait(ms = MOCK_DELAY) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeReading(reading) {
  const meta = PRACTICE_META[reading.practice] ?? PRACTICE_META.tarot;
  return { ...reading, practiceLabel: meta.label, icon: meta.icon };
}

function byNewest(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function getHistory({ userId, practice = 'all', page = 1, limit = 20 } = {}) {
  await wait();

  // TODO: Replace with http.get('/readings', { query: { practice, page, limit } }).
  const resolvedId = userId ?? await getMockUserId();
  const filtered = MOCK_READINGS
    .filter(r => r.userId === resolvedId)
    .filter(r => practice === 'all' || r.practice === practice)
    .sort(byNewest);

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit).map(normalizeReading);

  return { items, total: filtered.length, page, limit };
}

export async function getLatestReadings({ userId, limit = 3 } = {}) {
  const history = await getHistory({ userId, page: 1, limit });
  return history.items;
}

export async function getReadingStats({ userId } = {}) {
  await wait();

  // TODO: Replace with http.get('/readings/stats').
  const resolvedId = userId ?? await getMockUserId();
  const readings = MOCK_READINGS.filter(r => r.userId === resolvedId);
  const byPractice = readings.reduce((acc, r) => {
    acc[r.practice] = (acc[r.practice] ?? 0) + 1;
    return acc;
  }, {});

  const mostRead = Object.entries(byPractice)
    .sort((a, b) => b[1] - a[1])
    .map(([practice, count]) => {
      const meta = PRACTICE_META[practice] ?? PRACTICE_META.tarot;
      return {
        practice,
        label: meta.label,
        icon: meta.icon,
        count,
        pct: readings.length ? Math.round((count / readings.length) * 100) : 0,
      };
    });

  return {
    totalReadings: readings.length,
    dreamCount: byPractice.dream ?? 0,
    daysKept: 184,
    mostRead,
  };
}

export async function getReading(id) {
  await wait();

  // TODO: Replace with http.get(`/readings/${id}`).
  const reading = MOCK_READINGS.find(item => item.id === id);
  return reading ? normalizeReading(reading) : null;
}

export async function createReading(data) {
  await wait();

  // TODO: Replace with http.post('/readings', data).
  const userId = await getMockUserId();
  return normalizeReading({
    id: `mock-reading-${Date.now()}`,
    userId,
    status: 'complete',
    createdAt: new Date().toISOString(),
    ...data,
  });
}
