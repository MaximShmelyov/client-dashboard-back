import { components } from '../types/openapi';

type OrderStatus = components['schemas']['OrderStatus'];

const bitrixOrderStatusMap: Record<string, OrderStatus> = {
  'C24:NEW': 'new',
  'C24:EXECUTING': 'processing',
  'C24:PREPAYMENT_INVOIC': 'shipped',
  'C24:WON': 'delivered',
  'C24:LOSE': 'canceled',
};

const orderStatusToBitrix: Record<OrderStatus, string> = Object.fromEntries(
  Object.entries(bitrixOrderStatusMap).map(([bitrix, app]) => [app, bitrix]),
) as Record<OrderStatus, string>;

export function toOrderStatus(bitrixStatus: string): OrderStatus | undefined {
  const status = bitrixOrderStatusMap[bitrixStatus];
  return status;
}

export function toBitrixStatus(orderStatus: OrderStatus): string {
  const bitrixStatus = orderStatusToBitrix[orderStatus];
  if (!bitrixStatus)
    throw new Error(`Got unexpected orderStatus: ${orderStatus}`);
  return bitrixStatus;
}
