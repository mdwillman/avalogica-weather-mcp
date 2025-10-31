export function loadConfig() {
    const apiKey = process.env.WEATHER_API_KEY;
    const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const port = parseInt(process.env.PORT || '3002', 10);
    return {
        apiKey,
        port,
        nodeEnv,
        isProduction: nodeEnv === 'production',
    };
}
