export default interface Order {
  id: number;
  code: string;
  date: string;
  status: string;
  title: string;
  size?: number;
  weight?: string;
  volume?: string;
}
