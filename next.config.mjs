const nextConfig = {
    reactStrictMode: false,
    output: 'standalone',
    webpack: (config, { dev}) => {
        // Remove console.log in production builds
        if (!dev) {
            config.optimization.minimizer.forEach((minimizer) => {
                if (minimizer.constructor.name === 'TerserPlugin') {
                    minimizer.options.terserOptions.compress.drop_console = true;
                }
            });
        }
        return config;
    }
};

export default nextConfig;
