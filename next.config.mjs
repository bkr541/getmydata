/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['playwright-extra', 'puppeteer-extra-plugin-stealth', 'playwright-core'],
    },
};

export default nextConfig;
