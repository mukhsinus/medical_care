import type { CatalogItem } from "@/data/CatalogData";
import type { PaymeReceiptItem } from "./payme.types";

// то, что приходит из корзины
export type CartItem = {
  itemId: number;
  sizeKey?: string;   // "variants.sizes.10ml"
  quantity: number;
};

function toTiyin(sum: number): number {
  return Math.round(sum * 100);
}

export function buildPaymeItems(
  cart: CartItem[],
  allItems: CatalogItem[],
  t: (key: string) => string
): PaymeReceiptItem[] {
  return cart.map((cartItem) => {
    const item = allItems.find((x) => x.id === cartItem.itemId);

    if (!item) {
      throw new Error(`Catalog item not found: id=${cartItem.itemId}`);
    }

    // title
    const baseTitle = t(item.nameKey);
    const sizeTitle = cartItem.sizeKey ? t(cartItem.sizeKey) : "";
    const title = sizeTitle ? `${baseTitle} (${sizeTitle})` : baseTitle;

    // price
    let priceSum: number | undefined;

    if (cartItem.sizeKey && item.sizePrices?.[cartItem.sizeKey] != null) {
      priceSum = item.sizePrices[cartItem.sizeKey];
    } else if (item.price != null) {
      priceSum = item.price;
    }

    if (priceSum == null) {
      throw new Error(
        `Price not found for itemId=${item.id} sizeKey=${cartItem.sizeKey ?? "none"}`
      );
    }

    // IKPU
    const ikpu =
      (cartItem.sizeKey && item.sizeIkpuCodes?.[cartItem.sizeKey]) ||
      item.ikpuCode;

    if (!ikpu) {
      throw new Error(`IKPU not found for itemId=${item.id}`);
    }

    // package_code
    const packageCode =
      (cartItem.sizeKey && item.sizePackageCodes?.[cartItem.sizeKey]) ||
      item.package_code;

    if (!packageCode) {
      throw new Error(`package_code not found for itemId=${item.id}`);
    }

    return {
      title,
      price: toTiyin(priceSum),
      count: cartItem.quantity,
      code: ikpu,
      vat_percent: item.vat_percent ?? 12,
      package_code: packageCode,
    };
  });
}