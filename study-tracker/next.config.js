/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/child',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
