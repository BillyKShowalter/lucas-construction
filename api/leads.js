const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitStore = new Map();

function jsonResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
  };
}

function getAllowedOrigin(event) {
  const configured = process.env.ALLOWED_ORIGIN;
  if (configured) {
    return configured;
  }

  return event?.headers?.origin || '*';
}

function normalizeInput(value, maxLength = 3000) {
  return String(value || '').trim().slice(0, maxLength);
}

function validatePayload(payload) {
  const name = normalizeInput(payload.name, 120);
  const email = normalizeInput(payload.email, 200);
  const phone = normalizeInput(payload.phone, 50);
  const serviceType = normalizeInput(payload.serviceType, 120);
  const message = normalizeInput(payload.message, 3000);
  const honeypot = normalizeInput(payload.company, 100);

  if (honeypot) {
    return { spam: true };
  }

  if (!name || !email || !phone || !serviceType || !message) {
    return { error: 'Missing required fields.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { error: 'Invalid email address.' };
  }

  return { name, email, phone, serviceType, message };
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);

  return entry.count <= RATE_LIMIT_MAX;
}

async function sendLeadEmail(lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_TO_EMAIL;
  const from = process.env.LEADS_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New Lucas Construction Lead: ${lead.serviceType}`,
      html: `
        <h2>New Lead Submission</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Service:</strong> ${lead.serviceType}</p>
        <p><strong>Message:</strong><br>${lead.message.replace(/\n/g, '<br>')}</p>
      `
    })
  });

  if (!res.ok) {
    throw new Error('Email delivery failed.');
  }
}

exports.handler = async function handler(event) {
  const origin = getAllowedOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true }, origin);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method not allowed.' }, origin);
  }

  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  if (!checkRateLimit(ip)) {
    return jsonResponse(429, { success: false, error: 'Too many requests. Please try again later.' }, origin);
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { success: false, error: 'Invalid request payload.' }, origin);
  }

  const validation = validatePayload(payload);
  if (validation.spam) {
    return jsonResponse(200, { success: true }, origin);
  }

  if (validation.error) {
    return jsonResponse(400, { success: false, error: validation.error }, origin);
  }

  try {
    await sendLeadEmail(validation);
  } catch {
    return jsonResponse(502, { success: false, error: 'Unable to send message. Please try again.' }, origin);
  }

  return jsonResponse(200, { success: true }, origin);
};
