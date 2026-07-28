/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/teacher/:teacherID',
        destination: '/teacher',
        permanent: false,
      },
      {
        source: '/parent/Connections/:parentId',
        destination: '/parent',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
