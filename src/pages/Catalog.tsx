"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
   <picture> with AVIF → WebP → fallback
   ------------------------------------------------------------- */

type ItemPictureProps = {
  basename: string;
  alt: string;
  className?: string;
  imgClassName?: string;
};

function ItemPicture({
  basename,
  alt,
  className,
  imgClassName,
}: ItemPictureProps) {
  const { avif, webp, fallback } = getImageSources(basename);

  return (
    <picture className={className}>
      {avif && <source srcSet={avif} type="image/avif" />}
      {webp && <source srcSet={webp} type="image/webp" />}
      <img src={fallback} alt={alt} className={imgClassName} loading="lazy" />
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

    addItem(
      {
        id: item.id,
        name: displayName,
        price: item.price,
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
      <DialogContent className="sm:max-w-md w-[90vw] max-w-[90vw] bg-white rounded-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingBasket className="h-5 w-5" />
            {name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* IMAGE + DOTS INSIDE MODAL */}
          <div className="flex flex-col gap-3">
            <div className="relative h-40 w-full overflow-hidden rounded bg-gray-50 flex items-center justify-center">
              <ItemPicture
                basename={basenames[activeImageIndex]}
                alt={name}
                className="max-h-full max-w-full flex items-center justify-center"
                imgClassName="max-h-full max-w-full object-contain"
              />

              {basenames.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {basenames.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-1.5 w-1.5 rounded-full transition ${
                        idx === activeImageIndex
                          ? "bg-primary"
                          : "bg-primary/30"
                      }`}
                      aria-label={`Show image ${idx + 1}`}
                    />
                  ))}
                </div>
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
              ${item.price.toFixed(2)} each
            </span>
          </div>

          {/* COLORS (translated) */}
          {item.colors && item.colors.length > 0 && (
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {item.colors.map((colorKey) => {
                  const label = getTranslatedField(colorKey);
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setSelectedColorKey(colorKey)}
                      className={`px-2 py-1 text-xs rounded-full border transition ${
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
              <div className="flex flex-wrap gap-1.5">
                {item.sizes.map((sizeKey) => {
                  const label = getTranslatedField(sizeKey);
                  return (
                    <button
                      key={sizeKey}
                      type="button"
                      onClick={() => setSelectedSizeKey(sizeKey)}
                      className={`px-2 py-1 text-xs rounded-full border transition ${
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

  const getTranslatedField = (key: string): string => {
    const keys = key.split(".");
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
      if (!value) return key;
    }
    return typeof value === "string" ? value : key;
  };

  const getCategoryName = (key: string) => {
    if (key === "all") return t.catalog.allItems;
    const data = (t as any)?.cats?.[key] as { name?: string } | undefined;
    return data?.name ?? key;
  };

  const filterItems = (cat: string, srch: string) => {
    let list = allItems;
    if (cat !== "all") list = list.filter((i) => i.category === cat);
    if (srch.trim()) {
      list = list.filter((i) => {
        const name = getTranslatedField(i.nameKey);
        const desc = getTranslatedField(i.descriptionKey);
        return (
          name.toLowerCase().includes(srch.toLowerCase()) ||
          desc.toLowerCase().includes(srch.toLowerCase())
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
    setTimeout(() => {
      filterItems(cat, srch);
      setLoading(false);
    }, 300);
  }, [searchParams, t]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
    filterItems(cat, searchTerm);
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
    filterItems(activeCategory, "");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(activeCategory, searchTerm, page);
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
                const mobileOrderMap: Record<string, number> = {
                  injection: 2,
                  lab: 3,
                  surgery: 4,
                  hygiene: 5,
                  dressings: 6,
                  equipment: 7,
                };
                const desktopOrderMap: Record<string, number> = {
                  injection: 2,
                  equipment: 3,
                  surgery: 4,
                  hygiene: 5,
                  dressings: 6,
                  lab: 7,
                };

                const mOrder = mobileOrderMap[cat.key] ?? idx + 2;
                const dOrder = desktopOrderMap[cat.key] ?? idx + 2;
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
            {paginatedItems.map((item) => {
              const name = getTranslatedField(item.nameKey);
              const basenames = item.imageBases?.length
                ? item.imageBases
                : [item.imageBase];

              const Card = () => {
                const [imgIndex, setImgIndex] = useState(0);
                const isAdded = recentlyAddedId === item.id;

                const handleDotClick = (
                  e: React.MouseEvent<HTMLButtonElement>,
                  idx: number
                ) => {
                  e.stopPropagation();
                  setImgIndex(idx);
                };

                return (
                  <div
                    onClick={() => openModal(item)}
                    className="group cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-100"
                  >
                    <div className="relative aspect-square mb-3 overflow-hidden border-2 border-primary bg-transparent">
                      {/* Added badge */}
                      {isAdded && (
                        <div className="absolute top-2 left-2 z-10 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white flex items-center gap-1">
                          <span>✓</span> <span>Added</span>
                        </div>
                      )}

                      {/* Image */}
                      <ItemPicture
                        basename={basenames[imgIndex]}
                        alt={name}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-none"
                      />

                      {/* Image dots */}
                      {basenames.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {basenames.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => handleDotClick(e, idx)}
                              className={`h-1.5 w-1.5 rounded-full transition ${
                                idx === imgIndex
                                  ? "bg-primary"
                                  : "bg-primary/30 group-hover:bg-primary/50"
                              }`}
                              aria-label={`Show image ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="font-medium text-sm line-clamp-2 mb-1"
                      title={name}
                    >
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
                        ${item.price.toFixed(2)}
                      </span>
                      <ShoppingBasket
                        className={`h-5 w-5 text-primary transition-opacity ${
                          recentlyAddedId === item.id
                            ? "opacity-100"
                            : "opacity-70 group-hover:opacity-100"
                        }`}
                      />
                    </div>
                  </div>
                );
              };

              return <Card key={item.id} />;
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
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <Pagination>
                <PaginationContent>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
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
