export interface Module {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
  active: boolean;
}
