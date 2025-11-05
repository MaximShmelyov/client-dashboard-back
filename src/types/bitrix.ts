/**
 * Common types for Bitrix24 REST API
 */
export interface BitrixListResponse<T> {
  result: T[];
  total?: number;
  next?: number | null;
}

export interface BitrixSingleResponse<T> {
  item: T;
}

/**
 * Contact (crm.contact)
 */
export interface Contact {
  ID: string;
  NAME: string;
  LAST_NAME?: string;
  PHONE?: { VALUE: string }[];
  EMAIL?: { VALUE: string }[];
  UF_TELEGRAM_ID?: string;
  [key: string]: any; // for custom UF_* fields
}

/**
 * Deal (crm.deal)
 */
export interface Deal {
  ID: string;
  TITLE: string;
  CONTACT_ID?: string;
  STAGE_ID: string;
  UF_CRM_?: Record<string, any>;
  DATE_CREATE?: string;
  [key: string]: any;
}

/**
 * Smart process "Cargo" (entityTypeId = 168)
 */
export interface Cargo {
  id: number;
  entityTypeId: 168;
  parentId2: number; // Deal ID
  parentId189?: number | null; // Race ID
  stageId: string;
  ufCrm7_1731419267497?: string; // Cargo name
  ufCrm7_1731417708089?: string; // Marking
  ufCrm7_1716883127858?: number; // Number of places
  ufCrm7_1721843461760?: number; // Weight
  ufCrm7_1721843481050?: number; // Volume
  ufCrm7_1734107662696?: string;
  ufCrm7_1734107616044?: string;
  ufCrm7_1734107985364?: number;
  ufCrm7_1734107996009?: number;
  ufCrm7_1734108176874?: number;
  [key: string]: any;
}

/**
 * Smart process "Race" (entityTypeId = 189)
 */
export interface Race {
  id: number;
  entityTypeId: 189;
  stageId: string;
  title?: string;
  [key: string]: any;
}
