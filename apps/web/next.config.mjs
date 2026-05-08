/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fuse/core", "@fuse/connectors", "@fuse/db", "@fuse/engine"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    // workspace packages ship .ts source and re-export with .js extensions
    // (per moduleResolution: "Bundler"). Tell webpack to fall back to .ts
    // when a .js file isn't on disk.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".js", ".ts"],
      ".jsx": [".jsx", ".tsx"],
    };
    return config;
  },
};

export default nextConfig;
