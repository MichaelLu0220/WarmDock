/** @type {import('next').NextConfig} */
const nextConfig = {
  // workspace packages ship TypeScript source; Next must transpile them
  transpilePackages: ["@warmdock/ui-web", "@warmdock/api", "@warmdock/core"],
};

export default nextConfig;
