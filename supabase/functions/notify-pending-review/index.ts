type ReviewRecord = {
  name: string;
  destination: string;
  rating: number;
  message: string;
  status: string;
};

type ReviewWebhookPayload = {
  type: string;
  table: string;
  schema: string;
  record: ReviewRecord;
};

const isReviewWebhookPayload = (value: unknown): value is ReviewWebhookPayload => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const payload = value as Record<string, unknown>;
  const record = payload.record;
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;

  const review = record as Record<string, unknown>;
  return payload.type === "INSERT"
    && payload.schema === "public"
    && payload.table === "reviews"
    && review.status === "approved"
    && typeof review.name === "string"
    && review.name.trim().length > 0
    && review.name.length <= 60
    && typeof review.destination === "string"
    && review.destination.trim().length > 0
    && review.destination.length <= 100
    && typeof review.message === "string"
    && review.message.trim().length > 0
    && review.message.length <= 500
    && Number.isInteger(review.rating)
    && Number(review.rating) >= 1
    && Number(review.rating) <= 5;
};

const jsonResponse = (body: Record<string, string>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("REVIEW_WEBHOOK_SECRET");
  if (!webhookSecret || request.headers.get("x-webhook-secret") !== webhookSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  if (!isReviewWebhookPayload(payload)) {
    return jsonResponse({ error: "Unexpected review webhook payload" }, 400);
  }

  const review = payload.record;

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const recipient = Deno.env.get("REVIEW_NOTIFICATION_EMAIL");
  const sender = Deno.env.get("RESEND_FROM_EMAIL");
  const projectRef = Deno.env.get("REVIEW_PROJECT_REF");
  if (!resendApiKey || !recipient || !sender || !projectRef) {
    console.error("Missing required notification secrets or configuration.");
    return jsonResponse({ error: "Notification service is not configured" }, 500);
  }

  const destination = escapeHtml(review.destination);
  const name = escapeHtml(review.name);
  const message = escapeHtml(review.message).replace(/\r?\n/g, "<br>");
  const reviewerEmail = typeof review.email === "string" && review.email.trim() ? escapeHtml(review.email.trim()) : "";`n  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const dashboardUrl = `https://supabase.com/dashboard/project/${encodeURIComponent(projectRef)}/editor`;
  const email = {
    from: sender,
    to: [recipient],
    subject: "Nueva reseña publicada en tu sitio",
    html: [
      "<h2>Se publicó una nueva reseña</h2>",
      `<p><strong>Nombre:</strong> ${name}</p>`,
      `<p><strong>Destino:</strong> ${destination}</p>`,`n      reviewerEmail ? `<p><strong>Correo para responder:</strong> <a href="mailto:${reviewerEmail}">${reviewerEmail}</a></p>` : "<p><strong>Correo:</strong> no lo dejó</p>",
      `<p><strong>Valoración:</strong> ${stars} (${review.rating}/5)</p>`,
      `<p><strong>Reseña:</strong><br>${message}</p>`,
      `<p>Si necesitas ocultarla, cambia su <code>status</code> a <code>rejected</code> en <a href="${dashboardUrl}">Supabase Table Editor</a>, tabla <code>reviews</code>.</p>`,
    ].join(""),
  };

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(email),
    });
  } catch (error) {
    console.error("Could not reach the email provider:", error);
    return jsonResponse({ error: "Could not reach the email provider" }, 502);
  }

  if (!resendResponse.ok) {
    const providerError = await resendResponse.text();
    console.error("Email provider rejected the notification:", providerError);
    return jsonResponse({ error: "Email provider rejected the notification" }, 502);
  }

  return jsonResponse({ message: "Notification email sent" }, 200);
});
