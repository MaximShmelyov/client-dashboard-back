import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { verifiedMiddleware } from '../middleware/verified';
import { getContacts } from '../services/contacts.service';
import { getDealsByContact } from '../services/deals.service';
import { components, paths } from '../types/openapi';

// type PageParam = components['parameters']['PageParam'];
// type PageSizeParam = components['parameters']['PageSizeParam'];
// type StatusParam = components['parameters']['StatusParam'];
// type SortParam = components['parameters']['SortParam'];
// type OrderSort = components['schemas']['OrderSort'];
type OrdersQuery = paths['/orders']['get']['parameters']['query'];
type OrderResponse = components['schemas']['OrdersResponse'];
type Order = components['schemas']['Order'];
// type OrderStatus = components['schemas']['OrderStatus'];

const router = Router();

router.get('/', authMiddleware, verifiedMiddleware, async (req, res) => {
  const { page, pageSize, status, sort } = req.query as OrdersQuery;
  const contacts = await getContacts();
  const deals = await getDealsByContact(Number.parseInt(contacts.result[0].ID));

  function convertDateToISO(date: string): string {
    return new Date(date).toISOString();
  }

  const orders: Order[] = deals.result.map((deal) => {
    return {
      id: Number(deal.ID),
      code: deal.ID,
      date: convertDateToISO(deal.DATE_CREATE || new Date().toISOString()),
      status: 'processing',
      title: deal.TITLE,
    };
  });

  const orderResponse: OrderResponse = { orders, totalPages: 1 };
  res.status(200).json(orderResponse);
  // {
  //   "ID": "124",
  //   "TITLE": "Маркетинг кампания #2",
  //   "STAGE_ID": "C24:WON"
  // }
});

export default router;
