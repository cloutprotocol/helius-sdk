/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
    PUMPSWAP_PROGRAM_ID: process.env.PUMPSWAP_PROGRAM_ID,
  },
}

module.exports = nextConfig