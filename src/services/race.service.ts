import { ENV } from '../env';
import { CachedBitrixService } from '../lib/bxCache';
import { BitrixSingleResponse, Race } from '../types/bitrix';

const ENTITY_ID = 189;

export async function getRaceById(id: number) {
  return await CachedBitrixService.call<BitrixSingleResponse<Race>>(
    'crm.item.get',
    {
      entityTypeId: ENTITY_ID,
      id,
    },
    ENV.REDIS_CACHE_TTL_LONG,
  );
}
