const supabase = require("../config/supabase");

class ProfileError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ProfileError";
    this.status = status;
    this.code = code;
  }
}

async function getProfileByUserId(userId) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new ProfileError(500, "DB_ERROR", "Could not load profile.");
  }
  if (!user) {
    throw new ProfileError(404, "USER_NOT_FOUND", "User not found.");
  }

  const { data: astrologyProfile, error: profileError } = await supabase
    .from("astrology_profile")
    .select("birth_date, birth_time, birth_city, birth_country, zodiac_sign, moon_sign, rising_sign")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw new ProfileError(500, "DB_ERROR", "Could not load birth details.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    joinedAt: user.created_at,
    birthDate: astrologyProfile?.birth_date ?? null,
    birthTime: astrologyProfile?.birth_time ?? null,
    birthCity: astrologyProfile?.birth_city ?? null,
    birthCountry: astrologyProfile?.birth_country ?? null,
    zodiacSign: astrologyProfile?.zodiac_sign ?? null,
    moonSign: astrologyProfile?.moon_sign ?? null,
    risingSign: astrologyProfile?.rising_sign ?? null,
  };
}

function freeSubscriptionFallback() {
  // No user_subscription row (and/or subscription_plan is unseeded) — this is the honest
  // "no paid membership on file" state, not a stand-in for any specific plan's data.
  return {
    planId: null,
    planName: "Free",
    status: "free",
    statusLabel: "No active subscription",
    priceLabel: "Free",
    cadence: null,
    startedAt: null,
    renewsAt: null,
    paymentSummary: "No payment method",
    benefits: [],
  };
}

async function getSubscriptionByUserId(userId) {
  const { data: subscription, error } = await supabase
    .from("user_subscription")
    .select(
      "plan_id, status, billing_cycle, current_period_start, current_period_end, gateway_subscription_id, subscription_plan(name, price_monthly, price_yearly)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ProfileError(500, "DB_ERROR", "Could not load subscription.");
  }
  if (!subscription) {
    return freeSubscriptionFallback();
  }

  const plan = subscription.subscription_plan;
  const priceLabel = plan?.price_monthly != null
    ? (Number(plan.price_monthly) === 0 ? "Free" : `$${plan.price_monthly} / month`)
    : "Free";

  return {
    planId: subscription.plan_id,
    planName: plan?.name ?? "Free",
    status: subscription.status,
    statusLabel: subscription.status === "active" ? "Active membership" : subscription.status,
    priceLabel,
    cadence: subscription.billing_cycle ?? null,
    startedAt: subscription.current_period_start,
    renewsAt: subscription.current_period_end,
    paymentSummary: subscription.gateway_subscription_id ? "Payment on file" : "No payment method",
    benefits: [],
  };
}

const UNIQUE_VIOLATION = "23505";

async function updateProfile(userId, updates) {
  const { name, email, birthDate, birthPlace } = updates;

  const userUpdates = {};
  if (name !== undefined) userUpdates.name = String(name).trim();
  if (email !== undefined) userUpdates.email = String(email).trim().toLowerCase();

  if (Object.keys(userUpdates).length > 0) {
    if (userUpdates.email) {
      const { data: existing, error: lookupError } = await supabase
        .from("users")
        .select("id")
        .eq("email", userUpdates.email)
        .neq("id", userId)
        .maybeSingle();

      if (lookupError) {
        throw new ProfileError(500, "DB_ERROR", "Could not verify email availability.");
      }
      if (existing) {
        throw new ProfileError(409, "EMAIL_TAKEN", "An account with this email already exists.");
      }
    }

    const { error: userError } = await supabase
      .from("users")
      .update(userUpdates)
      .eq("id", userId);

    if (userError) {
      if (userError.code === UNIQUE_VIOLATION) {
        throw new ProfileError(409, "EMAIL_TAKEN", "An account with this email already exists.");
      }
      throw new ProfileError(500, "DB_ERROR", "Could not update account.");
    }
  }

  const astrologyUpdates = {};
  if (birthDate !== undefined) astrologyUpdates.birth_date = birthDate;
  if (birthPlace !== undefined) astrologyUpdates.birth_city = birthPlace || null;

  if (Object.keys(astrologyUpdates).length > 0) {
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from("astrology_profile")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileLookupError) {
      throw new ProfileError(500, "DB_ERROR", "Could not update birth details.");
    }

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from("astrology_profile")
        .update(astrologyUpdates)
        .eq("user_id", userId);

      if (updateError) {
        throw new ProfileError(500, "DB_ERROR", "Could not update birth details.");
      }
    } else {
      // astrology_profile is normally created at registration; guard for a missing row.
      if (!astrologyUpdates.birth_date) {
        throw new ProfileError(400, "MISSING_BIRTH_DATE", "Birth date is required to create a birth profile.");
      }
      const { error: insertError } = await supabase
        .from("astrology_profile")
        .insert({ user_id: userId, ...astrologyUpdates });

      if (insertError) {
        throw new ProfileError(500, "DB_ERROR", "Could not save birth details.");
      }
    }
  }
}

module.exports = { getProfileByUserId, getSubscriptionByUserId, updateProfile, ProfileError };
