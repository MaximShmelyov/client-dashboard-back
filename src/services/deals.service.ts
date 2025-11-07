import { ENV } from '../env';
import { CachedBitrixService } from '../lib/bxCache';
import {
  BitrixListResponse,
  BitrixSingleResponse,
  Deal,
} from '../types/bitrix';

export async function getDealsByContact(
  contactId: number,
  filter: Record<string, string> = {},
  order: Record<string, string> = { DATE_CREATE: 'ASC' },
  start = 0,
) {
  return await CachedBitrixService.call<BitrixListResponse<Deal>>(
    'crm.deal.list',
    {
      filter: { ...filter, CONTACT_ID: contactId },
      order,
      select: ['ID', 'TITLE', 'STAGE_ID', 'UF_*', '*'],
      start,
    },
    ENV.REDIS_CACHE_TTL_LONG,
  );
}

export async function getDealById(dealId: number) {
  return await CachedBitrixService.call<BitrixSingleResponse<Deal>>(
    'crm.deal.get',
    {
      id: dealId,
    },
    ENV.REDIS_CACHE_TTL_LONG,
  );
}
