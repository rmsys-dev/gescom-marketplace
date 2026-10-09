/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production"

function gescomApiUrl() {
  const raw = process.env.GESCOM_API_URL ?? process.env.API_URL
  if (!raw) return null
  try {
    return new URL(raw.replace(/\/$/, "").replace(/\/api\/v1$/i, ""))
  } catch {
    return null
  }
}

const gescomApi = gescomApiUrl()

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://images.unsplash.com",
  gescomApi?.origin,
]
  .filter(Boolean)
  .join(" ")

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
]

if (isProduction) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  })
}

/** @type {import('next').NextConfig['images']['remotePatterns']} */
const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
]

if (gescomApi) {
  remotePatterns.push({
    protocol: gescomApi.protocol.replace(":", ""),
    hostname: gescomApi.hostname,
    ...(gescomApi.port ? { port: gescomApi.port } : {}),
    pathname: "/fotos/**",
  })
}

const nextConfig = {
  images: {
    // Em dev a API roda em localhost; o otimizador do Next bloqueia IP privado por padrão (SSRF).
    dangerouslyAllowLocalIP: !isProduction,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/((?!api).*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
