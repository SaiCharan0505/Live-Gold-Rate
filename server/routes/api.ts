import { Router, Request, Response } from 'express';
import { INDIAN_CITIES } from '../config/cityConfig.js';
import { GoldCacheService } from '../services/goldCacheService.js';

export const apiRouter = Router();
const cacheService = GoldCacheService.getInstance();

/**
 * GET /api/health
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  const health = cacheService.getHealthStatus();
  res.json({
    ok: health.status === 'healthy' || health.status === 'degraded',
    service: 'Live Gold Price India Backend',
    timestamp: new Date().toISOString(),
    ...health,
  });
});

/**
 * GET /api/gold/latest?city=Hyderabad
 */
apiRouter.get('/gold/latest', async (req: Request, res: Response) => {
  try {
    const city = (req.query.city as string) || 'Hyderabad';
    const rateData = await cacheService.getCityGoldRate(city);
    res.json(rateData);
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'Failed to fetch latest gold rates from provider',
      message: error?.message || 'Upstream service error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/gold/cities
 * Returns supported cities, classifications, and current comparative rates
 */
apiRouter.get('/gold/cities', async (_req: Request, res: Response) => {
  try {
    const allCitiesData = await cacheService.getAllCities();
    res.json({
      success: true,
      total: INDIAN_CITIES.length,
      citiesConfig: INDIAN_CITIES.map((c) => ({
        id: c.id,
        name: c.name,
        state: c.state,
        region: c.region,
        associationName: c.associationName,
        classification: 'Retail Estimate (With Duty & GST)',
      })),
      rates: allCitiesData.cities,
      sourceTimestamp: allCitiesData.sourceTimestamp,
      lastCheckedTimestamp: allCitiesData.lastChecked,
      providerName: allCitiesData.providerName,
      isDemo: allCitiesData.isDemo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to load cities data',
      message: error?.message,
    });
  }
});

/**
 * GET /api/gold/history?city=Hyderabad&purity=24K&period=24h
 */
apiRouter.get('/gold/history', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || '24h';
    const city = (req.query.city as string) || 'hyderabad';
    const history = await cacheService.getHistory(period, city);
    res.json({
      success: true,
      ...history,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve historical data',
      points: [],
    });
  }
});

/**
 * GET /api/fx/latest
 */
apiRouter.get('/fx/latest', async (_req: Request, res: Response) => {
  try {
    const { data: marketData, lastChecked } = await cacheService.getLatestMarketData();
    res.json({
      success: true,
      base: 'USD',
      target: 'INR',
      rate: marketData.usdInrRate,
      sourceTimestamp: marketData.timestamp,
      lastCheckedTimestamp: lastChecked,
      provider: marketData.providerName,
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'Failed to fetch FX exchange rate',
      message: error?.message,
    });
  }
});
