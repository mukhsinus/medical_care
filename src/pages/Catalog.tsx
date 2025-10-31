'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Layout } from '@/components/Layout'
import { SEO } from '@/components/SEO'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Search, ChevronLeft, ShoppingBasket, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartContext'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import debounce from 'lodash.debounce'

/** Category images (kept for compatibility) */
import categoryInjection from '@/assets/category-injection.png'
import categoryEquipment from '@/assets/category-equipment.png'
import categorySurgery from '@/assets/category-surgery.png'
import categoryhygiene from '@/assets/category-hygiene.png'
import categoryDressings from '@/assets/sterilization.png'
import categoryLab from '@/assets/lab.png'

const itemsImg = import.meta.glob('@/assets/items/*.{png,jpg,jpeg,webp}', {
  eager: true,
})
const getImage = (filename: string) => {
  return itemsImg[`/src/assets/items/${filename}`]?.default
}

/* -------------------------------------------------------------
   Catalog data – add `boxInfo` for each item (optional)
   ------------------------------------------------------------- */
type CatalogItem = {
  id: number
  category: string
  nameKey: string
  descriptionKey: string
  price: number
  image: string
  boxInfo?: string
}

const allItems: CatalogItem[] = [
  {
    id: 1,
    category: 'injection',
    nameKey: 'items.1.name',
    descriptionKey: 'items.1.description',
    price: 2.5,
    image: getImage('insulin-syringe.webp'),
    boxInfo: '12 pcs per box',
  },
  {
    id: 2,
    category: 'injection',
    nameKey: 'items.2.name',
    descriptionKey: 'items.2.description',
    price: 0.8,
    image: getImage('hypodemic_21.webp'),
    boxInfo: '50 pcs per box',
  },
  {
    id: 3,
    category: 'injection',
    nameKey: 'items.3.name',
    descriptionKey: 'items.3.description',
    price: 1.2,
    image: getImage('cannula_20.png'),
    boxInfo: '100 pcs per box',
  },
  {
    id: 4,
    category: 'equipment',
    nameKey: 'items.4.name',
    descriptionKey: 'items.4.description',
    price: 15,
    image: getImage('dig_thermometer.webp'),
    boxInfo: '1 pc per box',
  },
  {
    id: 5,
    category: 'equipment',
    nameKey: 'items.5.name',
    descriptionKey: 'items.5.description',
    price: 45,
    image: getImage('blood-pressure.png'),
    boxInfo: '1 pc per box',
  },
  {
    id: 6,
    category: 'equipment',
    nameKey: 'items.6.name',
    descriptionKey: 'items.6.description',
    price: 120,
    image: getImage('stethoscope.png'),
    boxInfo: '1 pc per box',
  },
  {
    id: 7,
    category: 'surgery',
    nameKey: 'items.7.name',
    descriptionKey: 'items.7.description',
    price: 3.5,
    image: getImage('scalpel-11.png'),
    boxInfo: '10 pcs per box',
  },
  {
    id: 8,
    category: 'surgery',
    nameKey: 'items.8.name',
    descriptionKey: 'items.8.description',
    price: 8,
    image: getImage('forceps.webp'),
    boxInfo: '5 pcs per box',
  },
  {
    id: 9,
    category: 'surgery',
    nameKey: 'items.9.name',
    descriptionKey: 'items.9.description',
    price: 12,
    image: getImage('suture.webp'),
    boxInfo: '24 pcs per box',
  },
  {
    id: 10,
    category: 'hygiene',
    nameKey: 'items.10.name',
    descriptionKey: 'items.10.description',
    price: 5,
    image: getImage('alcohol.png'),
    boxInfo: '500 ml per bottle',
  },
  {
    id: 11,
    category: 'hygiene',
    nameKey: 'items.11.name',
    descriptionKey: 'items.11.description',
    price: 3.2,
    image: getImage('sanitizer.png'),
    boxInfo: '100 ml per bottle',
  },
  {
    id: 12,
    category: 'hygiene',
    nameKey: 'items.12.name',
    descriptionKey: 'items.12.description',
    price: 25,
    image: getImage('ppe.png'),
    boxInfo: '50 pcs per box',
  },
  {
    id: 13,
    category: 'dressings',
    nameKey: 'items.13.name',
    descriptionKey: 'items.13.description',
    price: 4.5,
    image: getImage('gauze.png'),
    boxInfo: '100 pcs per box',
  },
  {
    id: 14,
    category: 'dressings',
    nameKey: 'items.14.name',
    descriptionKey: 'items.14.description',
    price: 2,
    image: getImage('adhesive.png'),
    boxInfo: '200 pcs per box',
  },
  {
    id: 15,
    category: 'dressings',
    nameKey: 'items.15.name',
    descriptionKey: 'items.15.description',
    price: 18,
    image: getImage('hydrocolloid.png'),
    boxInfo: '10 pcs per box',
  },
  {
    id: 16,
    category: 'lab',
    nameKey: 'items.16.name',
    descriptionKey: 'items.16.description',
    price: 1.5,
    image: getImage('test-tube.webp'),
    boxInfo: '100 pcs per box',
  },
  {
    id: 17,
    category: 'lab',
    nameKey: 'items.17.name',
    descriptionKey: 'items.17.description',
    price: 0.3,
    image: getImage('pipette.webp'),
    boxInfo: '1000 pcs per box',
  },
  {
    id: 18,
    category: 'lab',
    nameKey: 'items.18.name',
    descriptionKey: 'items.18.description',
    price: 6,
    image: getImage('slides.png'),
    boxInfo: '72 pcs per box',
  },
]

const categories = [
  { key: 'all', name: 'All Products', icon: 'Package' },
  { key: 'injection', image: categoryInjection },
  { key: 'equipment', image: categoryEquipment },
  { key: 'surgery', image: categorySurgery },
  { key: 'hygiene', image: categoryhygiene },
  { key: 'dressings', image: categoryDressings },
  { key: 'lab', image: categoryLab },
]

/* -------------------------------------------------------------
   QUANTITY MODAL (embedded – no extra file needed)
   ------------------------------------------------------------- */
type QuantityModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: number
    name: string
    price: number
    image: string
    boxInfo?: string
  }
}

function QuantityModal({ open, onOpenChange, item }: QuantityModalProps) {
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 1) setQty(val)
  }

  const handleConfirm = () => {
    addItem(
      { id: item.id, name: item.name, price: item.price, image: item.image },
      qty
    )
    onOpenChange(false)
    setQty(1)
  }

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.select()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5" />
            Add to Basket
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={item.image}
              alt={item.name}
              className="h-16 w-16 rounded object-contain bg-accent/20"
            />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                ${item.price.toFixed(2)} each
              </p>
            </div>
          </div>

          {item.boxInfo && (
            <p className="text-xs text-muted-foreground italic">
              {item.boxInfo}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity (min. 1)</Label>
            <Input
              id="quantity"
              ref={inputRef}
              type="number"
              min={1}
              value={qty}
              onChange={handleChange}
              className="w-24"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Add {qty} {qty === 1 ? 'item' : 'items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------
   MAIN COMPONENT
   ------------------------------------------------------------- */
export default function Catalog() {
  const { t } = useLanguage()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16

  /* ---------- Modal state ---------- */
  const [modalOpen, setModalOpen] = useState(false)
  const [modalItem, setModalItem] = useState<{
    id: number
    name: string
    price: number
    image: string
    boxInfo?: string
  } | null>(null)

  /* ---------- Helper to get translated field ---------- */
  const getTranslatedField = (key: string): string => {
    const keys = key.split('.')
    let value: any = t
    for (const k of keys) {
      value = value?.[k]
      if (!value) return key
    }
    return typeof value === 'string' ? value : key
  }

  /* ---------- Debounced filter handler ---------- */
  const debouncedFilter = useCallback(
    debounce((cat: string, srch: string) => {
      filterItems(cat, srch)
    }, 300),
    [t]
  )

  /* ---------- sync URL → state ---------- */
  useEffect(() => {
    const cat = searchParams.get('category') ?? 'all'
    const srch = searchParams.get('search') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1') || 1

    setActiveCategory(cat)
    setSearchTerm(srch)
    setCurrentPage(page)

    setLoading(true)
    setTimeout(() => {
      filterItems(cat, srch)
      setLoading(false)
    }, 300)
  }, [searchParams, t])

  /* ---------- filter logic ---------- */
  const filterItems = (cat: string, srch: string) => {
    let list = allItems
    if (cat !== 'all') list = list.filter((i) => i.category === cat)
    if (srch.trim()) {
      list = list.filter((i) => {
        const name = getTranslatedField(i.nameKey)
        const desc = getTranslatedField(i.descriptionKey)
        return (
          name.toLowerCase().includes(srch.toLowerCase()) ||
          desc.toLowerCase().includes(srch.toLowerCase())
        )
      })
    }
    setFilteredItems(list)
  }

  /* ---------- pagination slice ---------- */
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  /* ---------- URL helpers ---------- */
  const updateUrl = (cat: string, srch: string, page: number = 1) => {
    const params = new URLSearchParams()
    if (cat !== 'all') params.set('category', cat)
    if (srch.trim()) params.set('search', srch)
    if (page > 1) params.set('page', page.toString())
    navigate(`?${params.toString()}`, { replace: true })
  }

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat)
    setCurrentPage(1)
    updateUrl(cat, searchTerm, 1)
    filterItems(cat, searchTerm)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchTerm(val)
    setCurrentPage(1)
    debouncedFilter(activeCategory, val)
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateUrl(activeCategory, searchTerm, 1)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
    updateUrl(activeCategory, '', 1)
    filterItems(activeCategory, '')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrl(activeCategory, searchTerm, page)
  }

  const handleContactClick = (item?: CatalogItem) => {
    const subject = item
      ? `Inquiry about ${getTranslatedField(item.nameKey)}`
      : 'Catalog Inquiry'
    window.open(
      `mailto:info@medicare.uz?subject=${encodeURIComponent(subject)}`,
      '_blank'
    )
  }

  const getCategoryName = (key: string) => {
    if (key === 'all') return t.catalog.allItems
    const data = t.categories[key as keyof typeof t.categories] as {
      name: string
    }
    return data?.name ?? key
  }

  /* ---------- loading UI ---------- */
  if (loading) {
    return (
      <Layout>
        <SEO title={t.catalog.title} description={t.catalog.subtitle} path="/catalog" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-muted-foreground">{t.catalog.loading}</p>
          </div>
        </div>
      </Layout>
    )
  }

  /* ---------- main UI ---------- */
  const visibleCategories = categories.filter((c) => c.key !== 'all')

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
              {activeCategory === 'all'
                ? t.catalog.title
                : `${getCategoryName(activeCategory)} - ${t.catalog.title}`}
            </h1>
            <p>{t.catalog.subtitle}</p>
          </div>

          {/* MOBILE: "All" button */}
          <div className="mb-3 md:hidden">
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition
                ${
                  activeCategory === 'all'
                    ? 'border-b-2 border-sky-500 text-sky-700 font-semibold'
                    : 'border border-transparent text-slate-700 bg-white/0 hover:bg-slate-50'
                }`}
              aria-pressed={activeCategory === 'all'}
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
          <nav className="md:hidden mb-6 flex justify-center">
            <ul className="grid grid-flow-col grid-rows-2 gap-4 justify-center">
              {visibleCategories.map((cat) => (
                <li key={cat.key} className="w-[110px] flex justify-center">
                  <div className="rounded-md bg-white shadow-sm w-full h-full flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.key)}
                      className={`w-full text-center px-3 py-2 text-[0.65rem] leading-tight transition rounded-md my-auto
                        ${
                          activeCategory === cat.key
                            ? 'border-b-2 border-sky-500 text-sky-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
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
            <ul className="flex flex-wrap items-center gap-3 md:gap-5 w-full">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('all')}
                  className={`px-2 md:px-3 py-1.5 text-sm md:text-base transition border-b-2
                    ${
                      activeCategory === 'all'
                        ? 'border-sky-500 text-sky-700 font-semibold'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  aria-pressed={activeCategory === 'all'}
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
                }
                const desktopOrderMap: Record<string, number> = {
                  injection: 2,
                  equipment: 3,
                  surgery: 4,
                  hygiene: 5,
                  dressings: 6,
                  lab: 7,
                }

                const mOrder = mobileOrderMap[cat.key] ?? idx + 2
                const dOrder = desktopOrderMap[cat.key] ?? idx + 2
                const orderClass = `order-${mOrder} md:order-${dOrder}`

                return (
                  <li key={cat.key} className={orderClass}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.key)}
                      className={`px-2 md:px-3 py-0.5 text-xs md:text-base transition border-b-2
                        ${
                          activeCategory === cat.key
                            ? 'border-sky-500 text-sky-700 font-semibold'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      aria-pressed={activeCategory === cat.key}
                    >
                      {getCategoryName(cat.key)}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* PRODUCTS GRID */}
          <div className="mb-12">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{t.catalog.noResults}</h3>
                <p className="mb-6 text-muted-foreground">
                  {searchTerm ? t.catalog.noSearchResults : t.catalog.noCategoryResults}
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    handleCategoryClick('all')
                  }}
                >
                  {t.catalog.clearFilters}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{t.catalog.products}</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredItems.length} {t.catalog.itemsFound}
                    </p>
                  </div>
                  {activeCategory !== 'all' && (
                    <Button
                      variant="outline"
                      onClick={() => handleCategoryClick('all')}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t.catalog.showAll}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 max-sm:gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedItems.map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden transition-shadow hover:shadow-lg group flex flex-col"
                      style={{ minHeight: '370px', maxHeight: '400px' }}
                    >
                      <div className="relative aspect-square overflow-hidden bg-accent/20">
                        <img
                          src={item.image}
                          alt={getTranslatedField(item.nameKey)}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).src =
                              '/images/placeholder-product.jpg'
                          }}
                        />
                        <Badge className="absolute right-2 top-2">
                          {getCategoryName(item.category)}
                        </Badge>
                      </div>

                      <CardHeader
                        className="pb-2 pt-4 flex-1"
                        // style={{ minHeight: '80px', maxHeight: '125px' }}
                      >
                        <CardTitle
                          className="text-lg"
                          style={{ height: '24px', overflow: 'hidden' }}
                          title={getTranslatedField(item.nameKey)}
                        >
                          {getTranslatedField(item.nameKey)}
                        </CardTitle>
                        <CardDescription
                          className="text-sm h-[24px] max-sm:h-[38px]"
                          style={{ overflow: 'hidden' }}
                          title={getTranslatedField(item.descriptionKey)}
                        >
                          {getTranslatedField(item.descriptionKey)}
                        </CardDescription>
                        <div className="mb-3">
                          <span className="text-l font-bold text-primary">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </CardHeader>

                      {/* <CardContent className="pt-0 flex flex-col justify-end max-sm:h-[80px]"> */}

                        <div className="flex gap-2 mx-auto pt-0 my-2 sm:my-4">
                          {/* ---- OPEN QUANTITY MODAL ---- */}
                          <Button
                            className="flex-1 h-10 text-xs"
                            onClick={() => {
                              setModalItem({
                                id: item.id,
                                name: getTranslatedField(item.nameKey),
                                price: item.price,
                                image: item.image,
                                boxInfo: item.boxInfo,
                              })
                              setModalOpen(true)
                            }}
                            title={t.catalog.addToBasket || 'Add'}
                          >
                            <ShoppingBasket className="h-6 w-6 flex-shrink-0" />
                            <span className="truncate max-sm:hidden">
                              {t.catalog.addToBasket || 'Add'}
                            </span>
                          </Button>

                          {/* ---- CONTACT ---- */}
                          <Button
                            className="flex-1 h-10 text-xs"
                            variant="outline"
                            onClick={() => handleContactClick(item)}
                            title={t.catalog.contactCta}
                          >
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{t.catalog.contactCta}</span>
                          </Button>
                        </div>
                      {/* </CardContent> */}
                    </Card>
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ---- QUANTITY MODAL ---- */}
          {modalItem && (
            <QuantityModal
              open={modalOpen}
              onOpenChange={(open) => {
                setModalOpen(open)
                if (!open) setModalItem(null)
              }}
              item={modalItem}
            />
          )}

          <div className="h-[var(--catalog-bottom-gap)]" aria-hidden />
        </div>
      </section>
    </Layout>
  )
}