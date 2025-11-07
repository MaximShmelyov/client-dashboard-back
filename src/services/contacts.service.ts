import { ENV } from '../env';
import { CachedBitrixService } from '../lib/bxCache';
import { BitrixListResponse, Contact } from '../types/bitrix';

export async function getContacts(filter = {}) {
  return await CachedBitrixService.call<BitrixListResponse<Contact>>(
    'crm.contact.list',
    {
      select: ['ID', 'EMAIL'],
      filter,
    },
    ENV.REDIS_CACHE_TTL_SHORT,
  );
}
