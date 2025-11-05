import axios from 'axios';
import { ENV } from '../env';
const baseURL = ENV.BITRIX_URL;

if (!baseURL) throw new Error('BITRIX_URL not defined in .env');

export class BitrixService {
  static async call<T = any>(
    method: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    // const url = `${baseURL}${method}`;
    // const response = await axios.get(url, { params });
    // if (response.data.error) throw new Error(response.data.error_description);
    // return response.data.result;
    try {
      const { data } = await axios.post(`${baseURL}${method}`, params);
      if (data.error)
        throw new Error(`${data.error}: ${data.error_description}`);
      return data as T;
    } catch (err: any) {
      console.error(`[Bitrix Error] ${method}:`, err.message);
      throw err;
    }
  }
}
