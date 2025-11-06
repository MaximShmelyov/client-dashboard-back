import {
  BitrixListResponse,
  BitrixSingleResponse,
  Deal,
} from '../types/bitrix';
import { BitrixService } from './bitrix24.service';

export async function getDealsByContact(
  contactId: number,
  filter: Record<string, string> = {},
  order: Record<string, string> = { DATE_CREATE: 'ASC' },
  start = 0,
) {
  return await BitrixService.call<BitrixListResponse<Deal>>('crm.deal.list', {
    filter: { ...filter, CONTACT_ID: contactId },
    order,
    select: ['ID', 'TITLE', 'STAGE_ID', 'UF_*', '*'],
    start,
  });
}

export async function getDealById(dealId: number) {
  return await BitrixService.call<BitrixSingleResponse<Deal>>('crm.deal.get', {
    id: dealId,
  });
}
