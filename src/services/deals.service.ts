import { BitrixListResponse, Deal } from '../types/bitrix';
import { BitrixService } from './bitrix24.service';

export async function getDealsByContact(contactId: number) {
  return await BitrixService.call<BitrixListResponse<Deal>>('crm.deal.list', {
    filter: { CONTACT_ID: contactId },
    select: ['ID', 'TITLE', 'STAGE_ID', 'UF_*', '*'],
  });
}
