import { BitrixListResponse, Contact } from '../types/bitrix';
import { BitrixService } from './bitrix24.service';

export async function getContacts(filter = {}) {
  return await BitrixService.call<BitrixListResponse<Contact>>(
    'crm.contact.list',
    { filter },
  );
}

export async function getContactById(id: number) {
  return await BitrixService.call<{ CONTACT: Contact }>('crm.contact.get', {
    id,
  });
}
