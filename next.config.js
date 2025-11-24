/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    BUILTWITH_API_KEY: process.env.BUILTWITH_API_KEY,
    SERPAPI_KEY: process.env.SERPAPI_KEY,
    CLEARBIT_API_KEY: process.env.CLEARBIT_API_KEY,
    WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
  },
}

module.exports = nextConfig
