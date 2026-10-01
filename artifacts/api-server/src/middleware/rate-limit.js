import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// Configurable thresholds from .env
const AUTH_WINDOW_MS = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000;
const AUTH_DELAY_AFTER = Number(process.env.RATE_LIMIT_AUTH_DELAY_AFTER) || 5;
const AUTH_MAX_IP = Number(process.env.RATE_LIMIT_AUTH_MAX_IP) || 30;
const AUTH_MAX_ACCOUNT = Number(process.env.RATE_LIMIT_AUTH_MAX_ACCOUNT) || 10;

const PUBLIC_WINDOW_MS = Number(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS) || 15 * 60 * 1000;
const PUBLIC_MAX = Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 100;

const AUTHENTICATED_WINDOW_MS = Number(process.env.RATE_LIMIT_AUTHED_WINDOW_MS) || 15 * 60 * 1000;
const AUTHENTICATED_MAX = Number(process.env.RATE_LIMIT_AUTHED_MAX) || 300;

// Helper for exponential backoff (cap at 30 seconds)
const calculateExponentialDelay = (hitsArg) => {
  const hits = typeof hitsArg === 'number' ? hitsArg : (hitsArg?.hits ?? hitsArg?.totalHits ?? 1);
  const overLimit = hits - AUTH_DELAY_AFTER;
  const delay = Math.pow(2, overLimit > 0 ? overLimit : 0) * 500; 
  return delay > 30000 ? 30000 : delay;
};

// 1. Auth routes - Per IP Slow Down
const authIpSlowDown = slowDown({
  windowMs: AUTH_WINDOW_MS,
  delayAfter: AUTH_DELAY_AFTER,
  delayMs: (used, req, res) => calculateExponentialDelay(used),
});

// 1. Auth routes - Per IP Hard Limit
const authIpRateLimit = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_IP,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts from this IP, please try again later." },
});

// 1. Auth routes - Per Account Slow Down (based on email)
const authAccountSlowDown = slowDown({
  windowMs: AUTH_WINDOW_MS,
  delayAfter: AUTH_DELAY_AFTER,
  keyGenerator: (req) => req.body?.email || req.ip || "unknown",
  delayMs: (used, req, res) => calculateExponentialDelay(used),
});

// 1. Auth routes - Per Account Hard Limit
const authAccountRateLimit = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_ACCOUNT,
  keyGenerator: (req) => req.body?.email || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts for this account, please try again later." },
});

// Combine auth limits
export const authLimiter = [
  authIpSlowDown,
  authIpRateLimit,
  authAccountSlowDown,
  authAccountRateLimit
];

// 2. Public endpoints (Moderate limits)
export const publicLimiter = rateLimit({
  windowMs: PUBLIC_WINDOW_MS,
  max: PUBLIC_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// 3. Authenticated actions (Looser limits)
export const authenticatedLimiter = rateLimit({
  windowMs: AUTHENTICATED_WINDOW_MS,
  max: AUTHENTICATED_MAX,
  keyGenerator: (req) => req.session?.userId ? `user_${req.session.userId}` : (req.ip || "unknown"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

export const apiLimiter = (req, res, next) => {
  if (req.session?.userId) {
    return authenticatedLimiter(req, res, next);
  }
  return publicLimiter(req, res, next);
};
