/**
 * Orders Router Module
 *
 * Provides endpoints for retrieving orders and detailed order information
 * associated with an authenticated and verified contact.
 *
 * Endpoints:
 *  - GET /orders:      List orders with pagination, sorting, and status filtering.
 *  - GET /orders/detailed:  Get detailed information about a specific order.
 *
 * Middlewares:
 *  - Rate limiter (per route)
 *  - Authentication
 *  - Verification
 *
 * @module routes/orders
 */
import { Router } from 'express';
import { RateLimitRequestHandler } from 'express-rate-limit';
import { ENV } from '../env';
import { authMiddleware } from '../middleware/auth';
import { verifiedMiddleware } from '../middleware/verified';
import { getDealsByContact } from '../services/deals.service';
import { Contact, Deal } from '../types/bitrix';
import { components, paths } from '../types/openapi';
import { toBitrixStatus, toOrderStatus } from '../utils/bitrixStatusConverter';

type OrdersQuery = paths['/orders']['get']['parameters']['query'];
type OrdersResponse = components['schemas']['OrdersResponse'];
type Order = components['schemas']['Order'];
type OrderDetailedQuery =
  paths['/orders/detailed']['get']['parameters']['query'];
type OrderDetailedResponse = components['schemas']['OrderDetailedResponse'];
type OrderDetailed = components['schemas']['OrderDetailed'];
type OrderItem = components['schemas']['OrderItem'];
type ErrorResponse = components['schemas']['ErrorResponse'];

/**
 * Creates an Express router for order-related endpoints.
 *
 * @param {Object} limiters - Object containing rate limiters.
 * @param {RateLimitRequestHandler} limiters.apiLimiter - Rate limiter for API requests.
 * @returns {Router} Configured Express router.
 */
export function createOrdersRouter(limiters: {
  apiLimiter: RateLimitRequestHandler;
}): Router {
  const router = Router();

  /**
   * Converts a date string to ISO format.
   * @param {string} date - Date string.
   * @returns {string} ISO formatted date string.
   */
  function convertDateToISO(date: string): string {
    return new Date(date).toISOString();
  }

  /**
   * GET /orders
   *
   * Returns a paginated list of orders for the authenticated contact.
   * Supports sorting and status filtering.
   *
   * Query parameters:
   *  - page: number (required)
   *  - pageSize: number (required)
   *  - sort: 'dateAsc' | 'dateDesc' | 'statusAsc' | 'statusDesc' (optional)
   *  - status: string (optional)
   *
   * Response: OrdersResponse
   */
  router.get(
    '/',
    limiters.apiLimiter,
    authMiddleware,
    verifiedMiddleware,
    async (req, res) => {
      const ordersQuery: OrdersQuery = req.query as any as OrdersQuery;
      const globalStart = (ordersQuery.page - 1) * ordersQuery.pageSize;

      const bitrixPage = Math.floor(globalStart / ENV.BITRIX_ITEMS_PER_PAGE);
      const bitrixStart = bitrixPage * ENV.BITRIX_ITEMS_PER_PAGE;
      const bitrixOffset = globalStart % ENV.BITRIX_ITEMS_PER_PAGE;

      const contact = (req as any).contact as Contact;

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
        Number.parseInt(contact.ID),
        status ? { STAGE_ID: status } : {},
        sort,
        bitrixStart,
      );
      let slicedDeals = deals.result.slice(
        bitrixOffset,
        bitrixOffset + ordersQuery.pageSize,
      );

      // Since BX ignores STAGE_ID sort, do it ourselves
      if (
        ordersQuery.sort === 'statusAsc' ||
        ordersQuery.sort === 'statusDesc'
      ) {
        const direction = ordersQuery.sort === 'statusAsc' ? 1 : -1;
        slicedDeals = slicedDeals.sort((a, b) => {
          const aStage = a.STAGE_ID ?? '';
          const bStage = b.STAGE_ID ?? '';
          return direction * aStage.localeCompare(bStage);
        });
      }

      const orders: Order[] = slicedDeals.map((deal) => {
        return {
          id: Number(deal.ID),
          code: deal.ID,
          date: deal.DATE_CREATE
            ? convertDateToISO(deal.DATE_CREATE)
            : undefined,
          status: toOrderStatus(deal.STAGE_ID),
          title: deal.TITLE,
        };
      });

      const ordersResponse: OrdersResponse = {
        orders,
        totalPages: deals.total
          ? Math.ceil(deals.total / ordersQuery.pageSize)
          : 1,
      };
      res.status(200).json(ordersResponse);
    },
  );

  /**
   * GET /orders/detailed
   *
   * Returns detailed information about a specific order for the authenticated contact.
   *
   * Query parameters:
   *  - id: number (required)
   *
   * Response: OrderDetailedResponse
   *  - 404 if order not found or not associated with the contact.
   */
  router.get(
    '/detailed',
    limiters.apiLimiter,
    authMiddleware,
    verifiedMiddleware,
    async (req, res) => {
      const orderDetailedQuery: OrderDetailedQuery =
        req.query as any as OrderDetailedQuery;
      const contact = (req as any).contact as Contact;

      const deals = await getDealsByContact(Number.parseInt(contact.ID), {
        ID: orderDetailedQuery.id.toString(),
      });
      // Order not found
      if (deals.result.length <= 0) {
        const emptyResponse: ErrorResponse = {
          statusCode: 404,
          error: 'Not found',
          message: `Not found order ${orderDetailedQuery.id} associated with the client`,
        };
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
  return router;
}
