import Redis from 'ioredis';

/**
 * Configurazione Redis per BullMQ
 * Supporta Redis locale e cloud (Railway, Upstash, etc.)
 */
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    // Usa URL Redis (formato: redis://user:pass@host:port)
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  } else {
    // Fallback a configurazione manuale
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  redisClient.on('error', (error) => {
    console.error('Redis connection error:', error);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  return redisClient;
}

/**
 * Chiude connessione Redis (utile per test o shutdown)
 */
export function closeRedisConnection() {
  if (redisClient) {
    redisClient.quit();
    redisClient = null;
  }
}

