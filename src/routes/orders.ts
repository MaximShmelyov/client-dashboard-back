import { Router } from 'express';
import { ENV } from '../env';
import { authMiddleware } from '../middleware/auth';
import { verifiedMiddleware } from '../middleware/verified';
import { getContacts } from '../services/contacts.service';
import { getDealsByContact } from '../services/deals.service';
import { Deal } from '../types/bitrix';
import { components, paths } from '../types/openapi';
import { toBitrixStatus, toOrderStatus } from '../utils/bitrixStatusConverter';

type OrdersQuery = paths['/orders']['get']['parameters']['query'];
type OrdersResponse = components['schemas']['OrdersResponse'];
type Order = components['schemas']['Order'];
type User = components['schemas']['User'];
type OrderDetailedQuery =
  paths['/orders/detailed']['get']['parameters']['query'];
type OrderDetailedResponse = components['schemas']['OrderDetailedResponse'];
type OrderDetailed = components['schemas']['OrderDetailed'];
type OrderItem = components['schemas']['OrderItem'];
type ErrorResponse = components['schemas']['ErrorResponse'];

const router = Router();

function convertDateToISO(date: string): string {
  return new Date(date).toISOString();
}

router.get('/', authMiddleware, verifiedMiddleware, async (req, res) => {
  const ordersQuery: OrdersQuery = req.query as any as OrdersQuery;
  const globalStart = (ordersQuery.page - 1) * ordersQuery.pageSize;

  const bitrixPage = Math.floor(globalStart / ENV.BITRIX_ITEMS_PER_PAGE);
  const bitrixStart = bitrixPage * ENV.BITRIX_ITEMS_PER_PAGE;
  const bitrixOffset = globalStart % ENV.BITRIX_ITEMS_PER_PAGE;

  const user: User = (req as any).user as User;
  const contacts = await getContacts({ EMAIL: user.email });
  if (contacts.result.length <= 0) {
    const emptyOrderResponse: OrdersResponse = {
      orders: [],
      totalPages: 0,
    };
    return res.status(200).json(emptyOrderResponse);
  }

  const sort = ((): Record<string, string> => {
    switch (ordersQuery.sort) {
      case 'dateAsc':
        return { DATE_CREATE: 'ASC' };
      case 'dateDesc':
        return { DATE_CREATE: 'DESC' };
      case 'statusAsc':
        return { STAGE_ID: 'ASC' };
      case 'statusDesc':
        return { STAGE_ID: 'DESC' };
      default:
        throw new Error(`unexpected sort: ${ordersQuery.sort}`);
    }
  })();

  const status = ((): string | undefined => {
    if (!ordersQuery.status) return;
    return toBitrixStatus(ordersQuery.status);
  })();

  const deals = await getDealsByContact(
    Number.parseInt(contacts.result[0].ID),
    status ? { STAGE_ID: status } : {},
    sort,
    bitrixStart,
  );

  const orders: Order[] = deals.result
    .slice(bitrixOffset, bitrixOffset + ordersQuery.pageSize)
    .map((deal) => {
      return {
        id: Number(deal.ID),
        code: deal.ID,
        date: deal.DATE_CREATE ? convertDateToISO(deal.DATE_CREATE) : undefined,
        status: toOrderStatus(deal.STAGE_ID),
        title: deal.TITLE,
      };
    });

  const ordersResponse: OrdersResponse = {
    orders,
    totalPages: deals.total ? Math.ceil(deals.total / ordersQuery.pageSize) : 1,
  };
  res.status(200).json(ordersResponse);
});

router.get(
  '/detailed',
  authMiddleware,
  verifiedMiddleware,
  async (req, res) => {
    const orderDetailedQuery: OrderDetailedQuery =
      req.query as any as OrderDetailedQuery;
    const user: User = (req as any).user as User;

    const emptyResponse: ErrorResponse = {
      statusCode: 404,
      error: 'Not found',
      message: `Not found order ${orderDetailedQuery.id} associated with the client`,
    };

    const contacts = await getContacts({ EMAIL: user.email });
    // Contact not found
    if (contacts.result.length <= 0) {
      return res.status(404).json(emptyResponse);
    }
    const deals = await getDealsByContact(
      Number.parseInt(contacts.result[0].ID),
      { ID: orderDetailedQuery.id.toString() },
    );
    // Order not found
    if (deals.result.length <= 0) {
      return res.status(404).json(emptyResponse);
    }
    const deal: Deal = deals.result[0];
    const orderItems: OrderItem[] = [
      {
        id: 0,
        marking: 'OrderItemMark',
        name: 'OrderItemName',
        orderId: Number(deal.ID),
        places: 1,
        raceId: 0,
        volume: 15,
        weight: 1000,
      },
      {
        id: 1,
        marking: 'OrderItemMark1',
        name: 'OrderItemName1',
        orderId: Number(deal.ID),
        places: 1,
        raceId: 0,
        volume: 25,
        weight: 500,
      },
    ];
    const orderDetailed: OrderDetailed = {
      id: Number(deal.ID),
      code: deal.ID,
      date: deal.DATE_CREATE ? convertDateToISO(deal.DATE_CREATE) : undefined,
      status: toOrderStatus(deal.STAGE_ID),
      title: deal.TITLE,
      orderItems,
    };
    const orderDetailedResponse: OrderDetailedResponse = {
      orderDetailed,
    };
    res.status(200).json(orderDetailedResponse);
  },
);

export default router;
