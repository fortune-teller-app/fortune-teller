'use server';

import { http } from './_http';
import { getAuthToken } from './auth';

function firstNameOf(name) {
  return name?.trim().split(' ')[0] ?? '';
}

function avatarInitialOf(name) {
  return name?.trim()?.[0]?.toUpperCase() ?? '?';
}

function formatBirthPlace(city, country) {
  return [city, country].filter(Boolean).join(', ') || null;
}

function normalizeProfile(profile) {
  const { subscription } = profile;

  return {
    id: profile.id,
    firstName: firstNameOf(profile.name),
    fullName: profile.name,
    avatarInitial: avatarInitialOf(profile.name),
    email: profile.email,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthPlace: formatBirthPlace(profile.birthCity, profile.birthCountry),
    roleLabel: 'Seeker',
    sunSign: profile.zodiacSign ?? 'Unknown',
    risingSign: profile.risingSign ?? 'Unknown',
    joinedAt: profile.joinedAt,
    subscription,
    subscriptionLabel: subscription.planName,
    subscriptionStatus: subscription.statusLabel,
    subscriptionPriceLabel: subscription.priceLabel,
  };
}

export async function getCurrentProfile() {
  const token = await getAuthToken();
  const { profile } = await http.get('/profile/me', { token });
  return normalizeProfile(profile);
}

export async function updateProfile(updates) {
  const token = await getAuthToken();
  const { profile } = await http.patch('/profile', updates, { token });
  return normalizeProfile(profile);
}
