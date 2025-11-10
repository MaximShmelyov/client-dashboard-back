import requestCalculationFields from '../requestCalculationFields.json';
import { components } from '../types/openapi';
type RequestCalculationRequest =
  components['schemas']['RequestCalculationRequest'];
export type RequestCalculationRequestWithoutPhoto = Omit<
  RequestCalculationRequest,
  'photo'
>;

/**
 * Converts a calculation request object into a formatted string for Bitrix CRM.
 *
 * Each field is labeled using values from requestCalculationFields.
 * If the photo URL is not provided, a link is used instead.
 *
 * @param {RequestCalculationRequestWithoutPhoto} request - Calculation request data without the photo field.
 * @param {string} photoUrl - URL of the uploaded photo (if any).
 * @returns {string} Formatted string for CRM comments.
 */
export default function calculationRequestToString(
  request: RequestCalculationRequestWithoutPhoto,
  photoUrl: string,
): string {
  return `${requestCalculationFields.originCountry}: ${request.originCountry}
${requestCalculationFields.transportType}: ${request.transportType}
${requestCalculationFields.title}: ${sanitize(request.title)}
${requestCalculationFields.weight}: ${request.weight}
${requestCalculationFields.volume}: ${request.volume}
${requestCalculationFields.linkOrPhoto}: ${photoUrl || request.link};
${requestCalculationFields.linkOrPhoto}: ${request.transportType}
${requestCalculationFields.comment}: ${sanitize(request.comment)}`;
}

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Remove leading/trailing whitespace, replace newlines/tabs, escape dangerous chars
  return value
    .trim()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>]/g, '');
}
