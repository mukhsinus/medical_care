"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Label } from "@/components/ui/label";

import {
  allItems,
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
   ITEM DETAILS PAGE
   ------------------------------------------------------------- */

export default function ItemDetails() {
  const { t } = useLanguage();
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const location = window.location;
  const { addItem } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);

  // Translation cache
  const translationCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    translationCache.current = new Map();
  }, [t]);

  const getTranslatedField = useCallback(
    (key: string): string => {
      const cached = translationCache.current.get(key);
      if (cached) return cached;

      const keys = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = t;
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          translationCache.current.set(key, key);
          return key;
        }
      }
      const result = typeof value === "string" ? value : key;
      translationCache.current.set(key, result);
      return result;
    },
    [t]
  );

  // Find item by ID - memoized
  const item = useMemo(() => allItems.find((i) => i.id === Number(itemId)), [itemId]);

  // Get current locale from URL - memoized
  const currentLocale = useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    return pathParts[0] || 'en';
  }, [location.pathname]);

  // Memoize derived values
  const name = useMemo(() => item ? getTranslatedField(item.nameKey) : "", [item, getTranslatedField]);
  const desc = useMemo(() => item ? getTranslatedField(item.descriptionKey) : "", [item, getTranslatedField]);

  const minQty = useMemo(() => 
    item?.boxInfo ? parseInt(item.boxInfo.match(/(\d+)/)?.[1] || "1", 10) : 1,
    [item?.boxInfo]
  );

  const basenames = useMemo(() => 
    item?.imageBases?.length ? item.imageBases : item?.imageBase ? [item.imageBase] : [],
    [item?.imageBases, item?.imageBase]
  );

  const [qty, setQty] = useState<number | "">(minQty);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(
    item?.colors?.[0] ?? null
  );
  const [selectedSizeKey, setSelectedSizeKey] = useState<string | null>(
    item?.sizes?.[0] ?? null
  );

  // Swipe handling for image gallery
  const touchStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const lastDeltaX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
    lastDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    lastDeltaX.current = deltaX;
    if (Math.abs(deltaX) > 15) {
      isSwiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) {
      touchStartX.current = null;
      lastDeltaX.current = 0;
      return;
    }

    const dx = lastDeltaX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) {
        setActiveImageIndex((prev) =>
          prev === basenames.length - 1 ? 0 : prev + 1
        );
      } else {
        setActiveImageIndex((prev) =>
          prev === 0 ? basenames.length - 1 : prev - 1
        );
      }
    }

    touchStartX.current = null;
    lastDeltaX.current = 0;
    isSwiping.current = false;
  }, [basenames.length]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setQty(raw === "" ? "" : Number(raw));
  }, []);

  const handleBlur = useCallback(() => {
    if (!qty || qty < minQty) {
      setQty(minQty);
    }
  }, [qty, minQty]);

  const increment = useCallback(() =>
    setQty((prev) => (prev === "" ? minQty + minQty : prev + minQty)),
    [minQty]
  );

  const decrement = useCallback(() =>
    setQty((prev) => {
      if (prev === "") return minQty;
      return Math.max(minQty, prev - minQty);
    }),
    [minQty]
  );

  const handleAdd = useCallback(() => {
    if (!item) return;
    
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

    navigate(`/${currentLocale}/catalog`);
  }, [item, qty, minQty, selectedColorKey, selectedSizeKey, name, desc, basenames, currentLocale, navigate, addItem, getTranslatedField]);

  const handleBack = useCallback(() => {
    navigate(`/${currentLocale}/catalog`);
  }, [currentLocale, navigate]);

  useEffect(() => {
    if (!item) {
      navigate(`/${currentLocale}/catalog`);
      return;
    }
    
    setQty(minQty);
    setActiveImageIndex(0);
    setSelectedColorKey(item.colors?.[0] ?? null);
    setSelectedSizeKey(item.sizes?.[0] ?? null);
  }, [itemId, item, minQty, navigate, currentLocale]);

  if (!item) {
    return null;
  }

  return (
    <Layout>
      <SEO
        title={`${name} | ${t.nav?.catalog || "Catalog"}`}
        description={desc}
        path={`/catalog/${itemId}`}
      />

      <section className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.catalog?.backToCatalog || "Back to Catalog"}
        </Button>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div
              className="relative h-96 md:h-[500px] w-full overflow-hidden rounded-lg bg-gray-50 border-2 border-primary"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative w-full h-full">
                {basenames.map((basename, idx) => {
                  // Only render current image for performance
                  if (idx !== activeImageIndex) return null;
                  
                  return (
                    <div
                      key={idx}
                      className="absolute inset-0 flex items-center justify-center"
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-primary rounded-full p-2 shadow-md z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-primary rounded-full p-2 shadow-md z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {basenames.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-2 w-2 rounded-full ${
                          idx === activeImageIndex
                            ? "bg-primary scale-125"
                            : "bg-primary/30 hover:bg-primary/50"
                        }`}
                        aria-label={`Show image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail gallery for desktop */}
            {basenames.length > 1 && (
              <div className="hidden md:flex gap-2 overflow-x-auto">
                {basenames.map((basename, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                      idx === activeImageIndex
                        ? "border-primary scale-105"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <ItemPicture
                      basename={basename}
                      alt={`${name} thumbnail ${idx + 1}`}
                      imgClassName="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
                <ShoppingBasket className="h-7 w-7 text-primary" />
                {name}
              </h1>
              {desc && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Description
                  </h2>
                  <p className="text-base text-gray-600 leading-relaxed">{desc}</p>
                </div>
              )}
              {item.boxInfo && (
                <p className="text-sm italic text-muted-foreground mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                  📦 {item.boxInfo} (min {minQty})
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <span className="text-3xl font-bold text-primary">
                $
                {(
                  (selectedSizeKey && item.sizePrices?.[selectedSizeKey]) ||
                  item.price || 0
                ).toFixed(2)}{" "}
                <span className="text-lg font-normal text-muted-foreground">each</span>
              </span>
            </div>

            {/* COLORS (translated) */}
            {item.colors && item.colors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {item.colors.map((colorKey) => {
                    const label = getTranslatedField(colorKey);
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setSelectedColorKey(colorKey)}
                        className={`px-4 py-2 text-sm rounded-md border transition ${
                          selectedColorKey === colorKey
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
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
              <div className="space-y-2">
                <Label className="text-base font-semibold">Size</Label>
                <div className="flex flex-wrap gap-2">
                  {item.sizes.map((sizeKey) => {
                    const label = getTranslatedField(sizeKey);
                    return (
                      <button
                        key={sizeKey}
                        type="button"
                        onClick={() => setSelectedSizeKey(sizeKey)}
                        className={`px-4 py-2 text-sm rounded-md border transition ${
                          selectedSizeKey === sizeKey
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
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
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="qty" className="text-base font-semibold">
                Quantity (min {minQty})
              </Label>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
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
                  className="w-32 text-center text-lg"
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={increment}
                >
                  +
                </Button>
              </div>

              {qty !== "" && qty < minQty && (
                <p className="text-sm text-red-600">
                  Minimum quantity is {minQty}
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAdd} className="flex-1" size="lg">
                <ShoppingBasket className="h-5 w-5 mr-2" />
                Add {qty || minQty} {qty === 1 ? "item" : "items"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
