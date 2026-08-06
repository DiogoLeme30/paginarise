const PIXEL_ID = "1218837936475239";
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";

const readBody = async (request) => {
  if (typeof request.body === "string") {
    return request.body ? JSON.parse(request.body) : {};
  }

  if (Buffer.isBuffer(request.body)) {
    const rawBody = request.body.toString("utf8");
    return rawBody ? JSON.parse(rawBody) : {};
  }

  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
};

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (!key) {
      return cookies;
    }

    cookies[key] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN;

  if (!accessToken) {
    response.status(500).json({ error: "Missing META_CONVERSIONS_ACCESS_TOKEN" });
    return;
  }

  try {
    const body = await readBody(request);
    const cookies = parseCookies(request.headers.cookie);
    const forwardedFor = request.headers["x-forwarded-for"];
    const clientIpAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : String(forwardedFor || request.socket.remoteAddress || "").split(",")[0].trim();

    const event = {
      event_name: body.event_name || "PageView",
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      action_source: "website",
      user_data: {
        client_ip_address: clientIpAddress,
        client_user_agent: request.headers["user-agent"],
        fbp: cookies._fbp,
        fbc: cookies._fbc,
      },
      custom_data: body.custom_data || {},
    };

    const metaResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
      }
    );
    const metaBody = await metaResponse.json();

    if (!metaResponse.ok) {
      response.status(metaResponse.status).json(metaBody);
      return;
    }

    response.status(200).json(metaBody);
  } catch (error) {
    response.status(500).json({ error: "Unable to send conversion event" });
  }
};
