import type { NextConfig } from "next";

// basePath for nginx sub-path proxy
const basePath = '/well';

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
  reactCompiler: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.3.67', '192.168.3.67:3020', '124.221.151.35', '124.221.151.35:5000'],
};

export default nextConfig;
