import { BitrixSingleResponse, Race } from '../types/bitrix';
import { BitrixService } from './bitrix24.service';

const ENTITY_ID = 189;

export async function getRaceById(id: number) {
  return await BitrixService.call<BitrixSingleResponse<Race>>('crm.item.get', {
    entityTypeId: ENTITY_ID,
    id,
  });
}
