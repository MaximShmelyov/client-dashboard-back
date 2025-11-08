import { ENV } from '../env';
import { CachedBitrixService } from '../lib/bxCache';
import { BitrixListResponse, Cargo } from '../types/bitrix';

export async function createCallbackRequest(contactId: number) {
  return await CachedBitrixService.call<BitrixListResponse<Cargo>>(
    'crm.lead.add',
    {
      fields: {
        TITLE: ENV.BITRIX_CALLBACK_RECORD_TITLE,
        STATUS_ID: 'NEW',
        OPENED: 'Y',
        IS_NEW: 'Y',
        CONTACT_ID: contactId,
      },
      params: {
        REGISTER_SONET_EVENT: 'Y',
      },
    },
    null,
  );
}
