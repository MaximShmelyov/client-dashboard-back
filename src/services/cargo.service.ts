import {
  BitrixListResponse,
  BitrixSingleResponse,
  Cargo,
} from '../types/bitrix';
import { BitrixService } from './bitrix24.service';

const ENTITY_ID = 168;

export async function getCargoByDeal(dealId: number) {
  return await BitrixService.call<BitrixListResponse<Cargo>>('crm.item.list', {
    entityTypeId: ENTITY_ID,
    filter: { parentId2: dealId },
    select: ['*'],
  });
}

export async function getCargoById(id: number) {
  return await BitrixService.call<BitrixSingleResponse<Cargo>>('crm.item.get', {
    entityTypeId: ENTITY_ID,
    id,
  });
}
