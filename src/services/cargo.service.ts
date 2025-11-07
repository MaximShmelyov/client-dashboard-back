import { ENV } from '../env';
import { CachedBitrixService } from '../lib/bxCache';
import {
  BitrixListResponse,
  BitrixSingleResponse,
  Cargo,
} from '../types/bitrix';

const ENTITY_ID = 168;

export async function getCargoByDeal(dealId: number) {
  return await CachedBitrixService.call<BitrixListResponse<Cargo>>(
    'crm.item.list',
    {
      entityTypeId: ENTITY_ID,
      filter: { parentId2: dealId },
      select: ['*'],
    },
    ENV.REDIS_CACHE_TTL_LONG,
  );
}

export async function getCargoById(id: number) {
  return await CachedBitrixService.call<BitrixSingleResponse<Cargo>>(
    'crm.item.get',
    {
      entityTypeId: ENTITY_ID,
      id,
    },
    ENV.REDIS_CACHE_TTL_LONG,
  );
}
