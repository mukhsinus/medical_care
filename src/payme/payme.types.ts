export type PaymeReceiptItem = {
  title: string;          // Название товара
  price: number;          // Цена за 1 единицу в тийинах
  count: number;          // Кол-во
  code: string;           // IKPU
  vat_percent: number;    // НДС %
  package_code: string;   // Код упаковки
  discount?: number;      // Скидка в тийинах (если есть)
};

export type PaymeReceiptDetail = {
  receipt_type: 0 | 1;
  shipping?: {
    title: string;
    price: number; // в тийинах
  };
  items: PaymeReceiptItem[];
};