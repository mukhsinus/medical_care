"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBasket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import debounce from "lodash.debounce";

import {
  allItems,
  categories,
  type CatalogItem,
  getImageSources,
} from "@/data/CatalogData";

/* -------------------------------------------------------------
   <picture> with WebP → fallback
   ------------------------------------------------------------- */

type ItemPictureProps = {
  basename: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
};

function ItemPicture({
  basename,
  alt,
  className,
  imgClassName,
  loading = "lazy",
}: ItemPictureProps) {
  const { webp, fallback } = useMemo(
    () => getImageSources(basename),
    [basename]
  );

  return (
    <picture className={className}>
      {webp && <source srcSet={webp} type="image/webp" />}
      <img
        src={fallback}
        alt={alt}
        className={imgClassName}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}

/* -------------------------------------------------------------
   ITEM MODAL – Full info + Add to Cart
   ------------------------------------------------------------- */

type ItemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogItem;
  getTranslatedField: (key: string) => string;
  onAddedToCart: (itemId: number) => void;
};

function ItemModal({
  open,
  onOpenChange,
  item,
  getTranslatedField,
  onAddedToCart,
}: ItemModalProps) {
  const { addItem } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);

  const name = getTranslatedField(item.nameKey);
  const desc = getTranslatedField(item.descriptionKey);

  const minQty = item.boxInfo
    ? parseInt(item.boxInfo.match(/(\d+)/)?.[1] || "1", 10)
    : 1;

  const [qty, setQty] = useState<number | "">(minQty);

  const basenames = item.imageBases?.length
    ? item.imageBases
    : [item.imageBase];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(
    item.colors?.[0] ?? null
  );
  const [selectedSizeKey, setSelectedSizeKey] = useState<string | null>(
    item.sizes?.[0] ?? null
  );

  // Swipe handling for modal image
  const touchStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const lastDeltaX = useRef(0);

  const handleModalTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
    lastDeltaX.current = 0;
  };

  const handleModalTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    lastDeltaX.current = deltaX;
    if (Math.abs(deltaX) > 15) {
      isSwiping.current = true;
    }
  };

  const handleModalTouchEnd = () => {
    if (!isSwiping.current) {
      touchStartX.current = null;
      lastDeltaX.current = 0;
      return;
    }

    const dx = lastDeltaX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) {
        // swipe left → next
        setActiveImageIndex((prev) =>
          prev === basenames.length - 1 ? 0 : prev + 1
        );
      } else {
        // swipe right → prev
        setActiveImageIndex((prev) =>
          prev === 0 ? basenames.length - 1 : prev - 1
        );
      }
    }

    touchStartX.current = null;
    lastDeltaX.current = 0;
    isSwiping.current = false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setQty(raw === "" ? "" : Number(raw));
  };

  const handleBlur = () => {
    if (!qty || qty < minQty) {
      setQty(minQty);
    }
  };

  const increment = () =>
    setQty((prev) => (prev === "" ? minQty + minQty : prev + minQty));

  const decrement = () =>
    setQty((prev) => {
      if (prev === "") return minQty;
      return Math.max(minQty, prev - minQty);
    });

  const handleAdd = () => {
    const finalQty = qty || minQty;

    // Variant labels (translated)
    const details: string[] = [];
    if (selectedColorKey) details.push(getTranslatedField(selectedColorKey));
    if (selectedSizeKey) details.push(getTranslatedField(selectedSizeKey));

    let displayName = name;
    if (details.length) {
      displayName = `${name} (${details.join(", ")})`;
    }

    const { fallback: mainImage } = getImageSources(basenames[0]);

    // Compute price according to selected size (if provided in data)
    const displayedPrice =
      (selectedSizeKey && item.sizePrices?.[selectedSizeKey]) || item.price;

    addItem(
      {
        id: item.id,
        name: displayName,
        description: desc,
        price: displayedPrice,
        image: mainImage,
      },
      finalQty
    );

    onAddedToCart(item.id);
    onOpenChange(false);
    setQty(minQty);
  };

  useEffect(() => {
    if (open) {
      setQty(minQty);
      setActiveImageIndex(0);
      setSelectedColorKey(item.colors?.[0] ?? null);
      setSelectedSizeKey(item.sizes?.[0] ?? null);

      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [open, minQty, item.colors, item.sizes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw] bg-white rounded-lg p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingBasket className="h-5 w-5" />
            {name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 overflow-y-auto flex-1">
          {/* IMAGE + DOTS INSIDE MODAL */}
          <div className="flex flex-col gap-3">
            <div
              className="relative h-40 w-full overflow-hidden rounded bg-gray-50"
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
            >
              <div className="relative w-full h-full" style={{ willChange: 'transform' }}>
                {basenames.map((basename, idx) => {
                  const offset = idx - activeImageIndex;
                  // Only render current, previous, and next images for performance
                  if (Math.abs(offset) > 1) return null;
                  
                  return (
                    <div
                      key={idx}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        transform: `translate3d(${offset * 100}%, 0, 0)`,
                        transition: 'transform 0.15s ease-out',
                        opacity: idx === activeImageIndex ? 1 : 0,
                        pointerEvents: idx === activeImageIndex ? 'auto' : 'none',
                      }}
                    >
                      <ItemPicture
                        basename={basename}
                        alt={name}
                        className="max-h-full max-w-full flex items-center justify-center"
                        imgClassName="max-h-full max-w-full object-contain"
                        loading="eager"
                      />
                    </div>
                  );
                })}
              </div>

              {basenames.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) =>
                        prev === 0 ? basenames.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-primary rounded-full p-1.5 shadow-md transition-transform duration-100 hover:scale-110 active:scale-95 z-10"
                    style={{ willChange: 'transform' }}
                    aria-label="Previous image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Right Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) =>
                        prev === basenames.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-primary rounded-full p-1.5 shadow-md transition-transform duration-100 hover:scale-110 active:scale-95 z-10"
                    style={{ willChange: 'transform' }}
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {basenames.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-1.5 w-1.5 rounded-full transition-transform duration-100 ${
                          idx === activeImageIndex
                            ? "bg-primary scale-125"
                            : "bg-primary/30 hover:bg-primary/50"
                        }`}
                        style={{ willChange: 'transform' }}
                        aria-label={`Show image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
              {item.boxInfo && (
                <p className="text-xs italic text-muted-foreground">
                  {item.boxInfo} (min {minQty})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              $
              {(
                (selectedSizeKey && item.sizePrices?.[selectedSizeKey]) ||
                item.price
              ).toFixed(2)}{" "}
              each
            </span>
          </div>

          {/* COLORS (translated) */}
          {item.colors && item.colors.length > 0 && (
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {item.colors.map((colorKey) => {
                  const label = getTranslatedField(colorKey);
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setSelectedColorKey(colorKey)}
                      className={`px-2 py-1 text-xs rounded-full border transition whitespace-nowrap ${
                        selectedColorKey === colorKey
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SIZES (translated) */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="space-y-1">
              <Label>Size</Label>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {item.sizes.map((sizeKey) => {
                  const label = getTranslatedField(sizeKey);
                  return (
                    <button
                      key={sizeKey}
                      type="button"
                      onClick={() => setSelectedSizeKey(sizeKey)}
                      className={`px-2 py-1 text-xs rounded-full border transition whitespace-nowrap ${
                        selectedSizeKey === sizeKey
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUANTITY */}
          <div className="grid gap-2">
            <Label htmlFor="qty">Quantity (min {minQty})</Label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={decrement}
              >
                −
              </Button>

              <Input
                id="qty"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={qty}
                placeholder={minQty.toString()}
                className="w-24 text-center"
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={increment}
              >
                +
              </Button>
            </div>

            {qty !== "" && qty < minQty && (
              <p className="text-xs text-red-600">
                Minimum quantity is {minQty}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            Add {qty || minQty} {qty === 1 ? "item" : "items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------
   PRODUCT CARD (Grid item) – extracted + optimized
   ------------------------------------------------------------- */

type CatalogCardProps = {
  item: CatalogItem;
  name: string;
  basenames: string[];
  isRecentlyAdded: boolean;
  getTranslatedField: (key: string) => string;
  onOpenModal: (item: CatalogItem) => void;
  isLcp?: boolean;
};

const CatalogCard = memo(
  function CatalogCard({
    item,
    name,
    basenames,
    isRecentlyAdded,
    getTranslatedField,
    onOpenModal,
    isLcp = false,
  }: CatalogCardProps) {
    const [imgIndex, setImgIndex] = useState(0);

    const touchStartX = useRef<number | null>(null);
    const isSwiping = useRef(false);
    const lastDeltaX = useRef(0);

    const handleDotClick = (
      e: React.MouseEvent<HTMLButtonElement>,
      idx: number
    ) => {
      e.stopPropagation();
      setImgIndex(idx);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      touchStartX.current = e.touches[0].clientX;
      isSwiping.current = false;
      lastDeltaX.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null) return;
      const deltaX = e.touches[0].clientX - touchStartX.current;
      lastDeltaX.current = deltaX;
      if (Math.abs(deltaX) > 15) {
        isSwiping.current = true;
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping.current) {
        touchStartX.current = null;
        lastDeltaX.current = 0;
        return;
      }

      const dx = lastDeltaX.current;
      if (Math.abs(dx) > 40) {
        if (dx < 0) {
          // swipe left → next image
          setImgIndex((prev) =>
            prev === basenames.length - 1 ? 0 : prev + 1
          );
        } else {
          // swipe right → prev image
          setImgIndex((prev) =>
            prev === 0 ? basenames.length - 1 : prev - 1
          );
        }
      }

      touchStartX.current = null;
      lastDeltaX.current = 0;
      isSwiping.current = false;
    };

    const handleClickCard = () => {
      if (isSwiping.current) {
        // Prevent opening modal when user was swiping
        return;
      }
      onOpenModal(item);
    };

    return (
      <div
        onClick={handleClickCard}
        className="group cursor-pointer transition-transform duration-75 hover:scale-[1.02] active:scale-100"
        style={{ willChange: 'transform', contain: 'layout style paint' }}
      >
        <div
          className="relative aspect-square mb-3 overflow-hidden border-2 border-primary bg-transparent"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Added badge */}
          {isRecentlyAdded && (
            <div className="absolute top-2 left-2 z-10 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white flex items-center gap-1">
              <span>✓</span> <span>Added</span>
            </div>
          )}

          {/* Image */}
          <div className="h-full w-full overflow-hidden" style={{ contain: 'paint' }}>
            <ItemPicture
              basename={basenames[imgIndex]}
              alt={name}
              className="h-full w-full"
              imgClassName="h-full w-full object-cover transition-transform duration-75 group-hover:scale-105 rounded-none"
              loading={isLcp ? "eager" : "lazy"}
            />
          </div>

          {/* Image dots */}
          {basenames.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {basenames.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleDotClick(e, idx)}
                  className={`h-1.5 w-1.5 rounded-full transition-transform duration-100 ${
                    idx === imgIndex
                      ? "bg-primary scale-125"
                      : "bg-primary/30 group-hover:bg-primary/50"
                  }`}
                  style={{ willChange: 'transform' }}
                  aria-label={`Show image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 mb-1" title={name}>
          {name}
        </h3>

        {/* VARIANT PREVIEW: colors / sizes (translated) */}
        {(item.colors?.length || item.sizes?.length) && (
          <div className="mb-1 flex flex-wrap gap-1">
            {item.colors?.slice(0, 3).map((colorKey) => (
              <span
                key={colorKey}
                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700"
              >
                {getTranslatedField(colorKey)}
              </span>
            ))}
            {item.colors && item.colors.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{item.colors.length - 3}
              </span>
            )}

            {item.sizes?.slice(0, 2).map((sizeKey) => (
              <span
                key={sizeKey}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-800"
              >
                {getTranslatedField(sizeKey)}
              </span>
            ))}
            {item.sizes && item.sizes.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{item.sizes.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price + Basket Icon */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary">
            {item.sizePrices
              ? `from UZS ${Math.min(
                  ...Object.values(item.sizePrices)
                ).toFixed(2)}`
              : `UZS ${item.price.toFixed(2)}`}
          </span>
          <ShoppingBasket
            className={`h-5 w-5 text-primary transition-opacity ${
              isRecentlyAdded
                ? "opacity-100"
                : "opacity-70 group-hover:opacity-100"
            }`}
          />
        </div>
      </div>
    );
  },
  (prev, next) => {
    // Re-render only when the relevant props change
    if (prev.item.id !== next.item.id) return false;
    if (prev.isRecentlyAdded !== next.isRecentlyAdded) return false;
    if (prev.name !== next.name) return false;
    if ((prev.basenames?.length ?? 0) !== (next.basenames?.length ?? 0))
      return false;
    if ((prev.isLcp ?? false) !== (next.isLcp ?? false)) return false;
    return true;
  }
);

/* -------------------------------------------------------------
   PAGINATION UTIL – compact page list with ellipsis
   ------------------------------------------------------------- */

function getPageList(
  currentPage: number,
  totalPages: number
): (number | "dots")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "dots")[] = [];

  const add = (p: number | "dots") => pages.push(p);

  const first = 1;
  const last = totalPages;

  if (currentPage <= 4) {
    // 1 2 3 4 5 ... N
    add(1);
    add(2);
    add(3);
    add(4);
    add(5);
    add("dots");
    add(last);
  } else if (currentPage >= totalPages - 3) {
    // 1 ... N-4 N-3 N-2 N-1 N
    add(first);
    add("dots");
    add(last - 4);
    add(last - 3);
    add(last - 2);
    add(last - 1);
    add(last);
  } else {
    // 1 ... P-1 P P+1 ... N
    add(first);
    add("dots");
    add(currentPage - 1);
    add(currentPage);
    add(currentPage + 1);
    add("dots");
    add(last);
  }

  return pages;
}

/* -------------------------------------------------------------
   CATEGORY ORDER MAPS (moved out of render)
   ------------------------------------------------------------- */

const MOBILE_ORDER_MAP: Record<string, number> = {
  injection: 2,
  lab: 3,
  surgery: 4,
  hygiene: 5,
  dressings: 6,
  equipment: 7,
};

const DESKTOP_ORDER_MAP: Record<string, number> = {
  injection: 2,
  equipment: 3,
  surgery: 4,
  hygiene: 5,
  dressings: 6,
  lab: 7,
};

/* -------------------------------------------------------------
   MAIN CATALOG
   ------------------------------------------------------------- */

export default function Catalog() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);
  // translation cache to avoid repeated key.split and deep traversal
  const translationCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    // clear cache when translations object changes
    translationCache.current = new Map();
  }, [t]);

  const getTranslatedField = useCallback(
    (key: string): string => {
      const cached = translationCache.current.get(key);
      if (cached) return cached;

      const keys = key.split(".");
      let value: any = t;
      for (const k of keys) {
        value = value?.[k];
        if (!value) {
          translationCache.current.set(key, key);
          return key;
        }
      }

      const out = typeof value === "string" ? value : key;
      translationCache.current.set(key, out);
      return out;
    },
    [t]
  );

  const getCategoryName = (key: string) => {
    if (key === "all") return t.catalog.allItems;
    const data = (t as any)?.cats?.[key] as { name?: string } | undefined;
    return data?.name ?? key;
  };

  const filterItems = (cat: string, srch: string) => {
    let list = allItems;
    if (cat !== "all") list = list.filter((i) => i.category === cat);
    if (srch.trim()) {
      const lower = srch.toLowerCase();
      list = list.filter((i) => {
        const name = getTranslatedField(i.nameKey);
        const desc = getTranslatedField(i.descriptionKey);
        return (
          name.toLowerCase().includes(lower) ||
          desc.toLowerCase().includes(lower)
        );
      });
    }
    setFilteredItems(list);
  };

  const debouncedFilter = useCallback(
    debounce((cat: string, srch: string) => {
      filterItems(cat, srch);
    }, 300),
    [t]
  );

  useEffect(() => {
    const cat = searchParams.get("category") ?? "all";
    const srch = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1") || 1;

    setActiveCategory(cat);
    setSearchTerm(srch);
    setCurrentPage(page);
    setLoading(true);

    const timeout = setTimeout(() => {
      filterItems(cat, srch);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchParams, t]);

  const totalPages = useMemo(
    () => Math.ceil(filteredItems.length / itemsPerPage) || 1,
    [filteredItems.length, itemsPerPage]
  );

  const paginatedItems = useMemo(
    () =>
      filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredItems, currentPage, itemsPerPage]
  );

  const updateUrl = (cat: string, srch: string, page: number = 1) => {
    const params = new URLSearchParams();
    if (cat !== "all") params.set("category", cat);
    if (srch.trim()) params.set("search", srch);
    if (page > 1) params.set("page", page.toString());
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    updateUrl(cat, searchTerm, 1);
    // filtering will be handled by the effect based on URL
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    debouncedFilter(activeCategory, val);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateUrl(activeCategory, searchTerm, 1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    updateUrl(activeCategory, "", 1);
    // filtering will be handled by the effect based on URL
  };

  const handlePageChange = (page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    if (clamped === currentPage) return;
    setCurrentPage(clamped);
    updateUrl(activeCategory, searchTerm, clamped);
  };

  const openModal = (item: CatalogItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <SEO
          title={t.catalog.title}
          description={t.catalog.subtitle}
          path="/catalog"
        />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-muted-foreground">{t.catalog.loading}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Not a hook → safe after the `if (loading)` return
  const visibleCategories = categories.filter((c) => c.key !== "all");

  return (
    <Layout>
      <SEO
        title={`${getCategoryName(activeCategory)} - ${t.catalog.title}`}
        description={t.catalog.subtitle}
        path="/catalog"
      />

      <section className="pb-16 pt-6 md:py-24">
        <div className="container mx-auto px-4">
          <div className="sr-only">
            <h1>
              {activeCategory === "all"
                ? t.catalog.title
                : `${getCategoryName(activeCategory)} - ${t.catalog.title}`}
            </h1>
            <p>{t.catalog.subtitle}</p>
          </div>

          {/* MOBILE: "All" button */}
          <div className="mb-3 md:hidden">
            <button
              type="button"
              onClick={() => handleCategoryClick("all")}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition
                ${
                  activeCategory === "all"
                    ? "border-b-2 border-sky-500 text-sky-700 font-semibold"
                    : "border border-transparent text-slate-700 bg-white/0 hover:bg-slate-50"
                }`}
              aria-pressed={activeCategory === "all"}
            >
              {t.catalog.allItems}
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="mx-auto mb-3 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t.catalog.searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={handleClearSearch}
                >
                  <span className="sr-only">Clear</span>×
                </Button>
              )}
            </div>
          </form>

          {/* MOBILE: categories grid */}
          <nav className="md:hidden mb-6 flex justify-center w-full">
            <ul className="grid grid-flow-col grid-rows-2 justify-between gap-y-3 w-full">
              {visibleCategories.map((cat) => (
                <li key={cat.key} className="w-[95px] flex justify-center">
                  <div className="rounded-md bg-white shadow-sm w-full h-full flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.key)}
                      className={`w-full text-center px-3 py-2 text-[0.65rem] leading-tight transition rounded-md my-auto
                        ${
                          activeCategory === cat.key
                            ? "border-b-2 border-sky-500 text-sky-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      aria-pressed={activeCategory === cat.key}
                      title={getCategoryName(cat.key)}
                    >
                      {getCategoryName(cat.key)}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </nav>

          {/* DESKTOP: categories */}
          <nav className="hidden md:block mx-auto mb-10 max-w-7xl overflow-x-hidden">
            <ul className="flex flex-wrap items-center gap-3 md:gap-5 w-auto mx-auto justify-center">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick("all")}
                  className={`px-2 md:px-3 py-1.5 text-sm md:text-base transition border-b-2
                    ${
                      activeCategory === "all"
                        ? "border-sky-500 text-sky-700 font-semibold"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  aria-pressed={activeCategory === "all"}
                >
                  {t.catalog.allItems}
                </button>
              </li>

              {visibleCategories.map((cat, idx) => {
                const mOrder = MOBILE_ORDER_MAP[cat.key] ?? idx + 2;
                const dOrder = DESKTOP_ORDER_MAP[cat.key] ?? idx + 2;
                const orderClass = `order-${mOrder} md:order-${dOrder}`;

                return (
                  <li key={cat.key} className={orderClass}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.key)}
                      className={`px-2 md:px-3 py-0.5 text-xs md:text-base transition border-b-2
                        ${
                          activeCategory === cat.key
                            ? "border-sky-500 text-sky-700 font-semibold"
                            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                        }`}
                      aria-pressed={activeCategory === cat.key}
                    >
                      {getCategoryName(cat.key)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* PRODUCTS GRID */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {paginatedItems.map((item, idx) => {
              const name = getTranslatedField(item.nameKey);
              const basenames = item.imageBases?.length
                ? item.imageBases
                : [item.imageBase];

              const isLcp = currentPage === 1 && idx === 0;

              return (
                <CatalogCard
                  key={item.id}
                  item={item}
                  name={name}
                  basenames={basenames}
                  isRecentlyAdded={recentlyAddedId === item.id}
                  getTranslatedField={getTranslatedField}
                  onOpenModal={openModal}
                  isLcp={isLcp}
                />
              );
            })}
          </div>

          {/* No Results */}
          {filteredItems.length === 0 && (
            <div className="py-16 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t.catalog.noResults}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? t.catalog.noSearchResults
                  : t.catalog.noCategoryResults}
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  handleCategoryClick("all");
                }}
              >
                {t.catalog.clearFilters}
              </Button>
            </div>
          )}

          {/* Pagination */}
          {filteredItems.length > 0 && totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <Pagination>
                <PaginationContent className="flex flex-wrap gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getPageList(currentPage, totalPages).map(
                    (page, index) => (
                      <PaginationItem key={`${page}-${index}`}>
                        {page === "dots" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>

      {/* MODAL */}
      {selectedItem && (
        <ItemModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedItem(null);
          }}
          item={selectedItem}
          getTranslatedField={getTranslatedField}
          onAddedToCart={(id) => {
            setRecentlyAddedId(id);
            setTimeout(() => {
              setRecentlyAddedId((prev) => (prev === id ? null : prev));
            }, 2500);
          }}
        />
      )}
    </Layout>
  );
}
