/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Pin the workspace root to this folder. With a second lockfile at the
     repo root, Next otherwise infers that as the root and then cannot
     resolve tailwindcss, which is only installed here. Next requires
     outputFileTracingRoot to match turbopack.root, so both are set. */
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // your Cloudinary domain
        port: "",
        pathname: "/**", // allow all paths
      },
    ],
  },
};

module.exports = nextConfig;
