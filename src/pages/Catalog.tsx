'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Layout } from '@/components/Layout'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Search, ShoppingBasket } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
   Catalog data
   ------------------------------------------------------------- */
type CatalogItem = {
  id: number
  category: string
  nameKey: string
  descriptionKey: string
  price: number
  image: string
  boxInfo?: string // e.g. "12 pcs per box"
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
   ITEM MODAL – Full info + Add to Cart (Fixed)
   ------------------------------------------------------------- */
type ItemModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CatalogItem
  getTranslatedField: (key: string) => string
}

function ItemModal({ open, onOpenChange, item, getTranslatedField }: ItemModalProps) {
  const { addItem } = useCart()
  const inputRef = useRef<HTMLInputElement>(null)

  const name = getTranslatedField(item.nameKey)
  const desc = getTranslatedField(item.descriptionKey)

  const minQty = item.boxInfo
    ? parseInt(item.boxInfo.match(/(\d+)/)?.[1] || '1', 10)
    : 1

  const [qty, setQty] = useState(minQty)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
    if (val === '' || (!isNaN(val) && val >= minQty)) {
      setQty(val === '' ? '' : val)
    }
  }

  const handleBlur = () => {
    if (!qty || qty < minQty) {
      setQty(minQty)
    }
  }

  const increment = () => setQty(prev => Math.max(minQty, (prev || minQty) + minQty))
  const decrement = () => setQty(prev => Math.max(minQty, (prev || minQty) - minQty))

  const handleAdd = () => {
    const finalQty = qty || minQty
    addItem(
      { id: item.id, name, price: item.price, image: item.image },
      finalQty
    )
    onOpenChange(false)
    setQty(minQty)
  }

  useEffect(() => {
    if (open) {
      setQty(minQty)
      setTimeout(() => inputRef.current?.select(), 100)
    }
  }, [open, minQty])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md w-[90vw] max-w-[90vw] bg-white rounded-lg p-4 sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingBasket className="h-5 w-5" />
            {name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex gap-4">
            <img
              src={item.image}
              alt={name}
              className="h-24 w-24 rounded object-contain bg-gray-50"
            />
            <div className="flex-1 space-y-2">
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

          {/* Custom Quantity Controls */}
<div className="grid gap-2">
  <Label htmlFor="qty">Quantity (min {minQty})</Label>

  <div className="flex items-center gap-2">
    {/*  –  */}
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-10 w-10 shrink-0"
      onClick={() => setQty(prev => Math.max(minQty, (prev ?? minQty) - minQty))}
    >
      −
    </Button>

    {/*  INPUT  */}
    <Input
      id="qty"
      ref={inputRef}
      type="text"
      inputMode="numeric"          // numeric keypad on mobile
      pattern="[0-9]*"
      value={qty}
      placeholder={minQty.toString()}
      className="w-24 text-center"
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')   // keep only digits
        setQty(raw === '' ? '' : Number(raw))
      }}
      onBlur={() => {
        if (!qty || qty < minQty) setQty(minQty)
      }}
    />

    {/*  +  */}
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-10 w-10 shrink-0"
      onClick={() => setQty(prev => (prev ?? minQty) + minQty)}
    >
      +
    </Button>
  </div>

  {/*  live warning  */}
  {qty !== '' && qty < minQty && (
    <p className="text-xs text-red-600">Minimum quantity is {minQty}</p>
  )}
</div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            Add {qty || minQty} {qty === 1 ? 'item' : 'items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
/* -------------------------------------------------------------
   MAIN CATALOG
   ------------------------------------------------------------- */
export default function Catalog() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)

  const getTranslatedField = (key: string): string => {
    const keys = key.split('.')
    let value: any = t
    for (const k of keys) {
      value = value?.[k]
      if (!value) return key
    }
    return typeof value === 'string' ? value : key
  }

  const getCategoryName = (key: string) => {
    if (key === 'all') return t.catalog.allItems
    const data = t.cats[key as keyof typeof t.cats] as { name: string }
    return data?.name ?? key
  }

  const debouncedFilter = useCallback(
    debounce((cat: string, srch: string) => {
      filterItems(cat, srch)
    }, 300),
    [t]
  )

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

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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

  const openModal = (item: CatalogItem) => {
    setSelectedItem(item)
    setModalOpen(true)
  }

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
          <nav className="md:hidden mb-6 flex justify-center w-full">
            <ul className="grid grid-flow-col grid-rows-2 justify-between gap-x-6 gap-y-3 w-full">
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
            <ul className="flex flex-wrap items-center gap-3 md:gap-5 w-auto mx-auto justify-center">
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


          {/* PRODUCTS GRID – NO BACKGROUND, NO BADGE */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {paginatedItems.map((item) => {
              const name = getTranslatedField(item.nameKey)
              return (
                <div
                  key={item.id}
                  onClick={() => openModal(item)}
                  className="group cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-100"
                >
                  {/* Image */}
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-transparent">
                    <img
                      src={item.image}
                      alt={name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          '/images/placeholder-product.jpg'
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-medium text-sm line-clamp-2 mb-1" title={name}>
                    {name}
                  </h3>

                  {/* Price + Basket Icon */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      ${item.price.toFixed(2)}
                    </span>
                    <ShoppingBasket className="h-5 w-5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* No Results */}
          {filteredItems.length === 0 && (
            <div className="py-16 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.catalog.noResults}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? t.catalog.noSearchResults : t.catalog.noCategoryResults}
              </p>
              <Button onClick={() => { setSearchTerm(''); handleCategoryClick('all') }}>
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
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
            setModalOpen(open)
            if (!open) setSelectedItem(null)
          }}
          item={selectedItem}
          getTranslatedField={getTranslatedField}
        />
      )}
    </Layout>
  )
}