import { ENV } from '../env';
import { CachedBitrixService } from '../lib/bxCache';
import { BitrixListResponse, Cargo } from '../types/bitrix';

/**
 * Creates a callback request lead in Bitrix CRM for the specified contact.
 *
 * @param {number} contactId - Bitrix contact ID.
 * @returns {Promise<BitrixListResponse<Cargo>>} Bitrix API response.
 */
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

/**
 * Creates a calculation request lead in Bitrix CRM for the specified contact with a given description.
 *
 * @param {number} contactId - Bitrix contact ID.
 * @param {string} description - Request description to be added to the lead comments.
 * @returns {Promise<BitrixListResponse<Cargo>>} Bitrix API response.
 */
export async function createCalculationRequest(
  contactId: number,
  description: string,
) {
  return await CachedBitrixService.call<BitrixListResponse<Cargo>>(
    'crm.lead.add',
    {
      fields: {
        TITLE: ENV.BITRIX_CALCULATION_REQUEST_RECORD_TITLE,
        STATUS_ID: 'NEW',
        OPENED: 'Y',
        IS_NEW: 'Y',
        CONTACT_ID: contactId,
        COMMENTS: description,
      },
      params: {
        REGISTER_SONET_EVENT: 'Y',
      },
    },
    null,
  );
}
