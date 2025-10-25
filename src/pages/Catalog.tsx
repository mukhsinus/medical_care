'use client'

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Layout } from '@/components/Layout'
import { SEO } from '@/components/SEO'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Search, ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import debounce from 'lodash.debounce'

/** Category images are unused but kept for compatibility */
import categoryInjection from '@/assets/category-injection.png'
import categoryEquipment from '@/assets/category-equipment.png'
import categorySurgery from '@/assets/category-surgery.png'
import categoryhygiene from '@/assets/category-hygiene.png'
import categoryDressings from '@/assets/sterilization.png'
import categoryLab from '@/assets/lab.png'

const itemsImg = import.meta.glob('@/assets/items/*.{png,jpg,jpeg,webp}', { eager: true })
const getImage = (filename: string) => {
  // @ts-ignore
  return itemsImg[`/src/assets/items/${filename}`]?.default
}

type CatalogItem = {
  id: number
  category: string
  nameKey: string
  descriptionKey: string
  price: number
  image: string
}

const allItems: CatalogItem[] = [
  { id: 1, category: 'injection', nameKey: 'items.1.name', descriptionKey: 'items.1.description', price: 2.5, image: getImage('insulin-syringe.webp') },
  { id: 2, category: 'injection', nameKey: 'items.2.name', descriptionKey: 'items.2.description', price: 0.8, image: getImage('hypodemic_21.webp') },
  { id: 3, category: 'injection', nameKey: 'items.3.name', descriptionKey: 'items.3.description', price: 1.2, image: getImage('cannula_20.png') },
  { id: 4, category: 'equipment', nameKey: 'items.4.name', descriptionKey: 'items.4.description', price: 15, image: getImage('dig_thermometer.webp') },
  { id: 5, category: 'equipment', nameKey: 'items.5.name', descriptionKey: 'items.5.description', price: 45, image: getImage('blood-pressure.png') },
  { id: 6, category: 'equipment', nameKey: 'items.6.name', descriptionKey: 'items.6.description', price: 120, image: getImage('stethoscope.png') },
  { id: 7, category: 'surgery', nameKey: 'items.7.name', descriptionKey: 'items.7.description', price: 3.5, image: getImage('scalpel-11.png') },
  { id: 8, category: 'surgery', nameKey: 'items.8.name', descriptionKey: 'items.8.description', price: 8, image: getImage('forceps.webp') },
  { id: 9, category: 'surgery', nameKey: 'items.9.name', descriptionKey: 'items.9.description', price: 12, image: getImage('suture.webp') },
  { id: 10, category: 'hygiene', nameKey: 'items.10.name', descriptionKey: 'items.10.description', price: 5, image: getImage('alcohol.png') },
  { id: 11, category: 'hygiene', nameKey: 'items.11.name', descriptionKey: 'items.11.description', price: 3.2, image: getImage('sanitizer.png') },
  { id: 12, category: 'hygiene', nameKey: 'items.12.name', descriptionKey: 'items.12.description', price: 25, image: getImage('ppe.png') },
  { id: 13, category: 'dressings', nameKey: 'items.13.name', descriptionKey: 'items.13.description', price: 4.5, image: getImage('gauze.png') },
  { id: 14, category: 'dressings', nameKey: 'items.14.name', descriptionKey: 'items.14.description', price: 2, image: getImage('adhesive.png') },
  { id: 15, category: 'dressings', nameKey: 'items.15.name', descriptionKey: 'items.15.description', price: 18, image: getImage('hydrocolloid.png') },
  { id: 16, category: 'lab', nameKey: 'items.16.name', descriptionKey: 'items.16.description', price: 1.5, image: getImage('test-tube.webp') },
  { id: 17, category: 'lab', nameKey: 'items.17.name', descriptionKey: 'items.17.description', price: 0.3, image: getImage('pipette.webp') },
  { id: 18, category: 'lab', nameKey: 'items.18.name', descriptionKey: 'items.18.description', price: 6, image: getImage('slides.png') },
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
    [t] // Re-create when translation changes
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
    if (cat !== 'all') list = list.filter(i => i.category === cat)
    if (srch.trim()) {
      list = list.filter(i => {
        const translatedName = getTranslatedField(i.nameKey)
        const translatedDescription = getTranslatedField(i.descriptionKey)
        return (
          translatedName.toLowerCase().includes(srch.toLowerCase()) ||
          translatedDescription.toLowerCase().includes(srch.toLowerCase())
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
    const data = t.categories[key as keyof typeof t.categories] as { name: string }
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
  const visibleCategories = categories.filter(c => c.key !== 'all')

  return (
    <Layout>
      <SEO
        title={`${getCategoryName(activeCategory)} - ${t.catalog.title}`}
        description={t.catalog.subtitle}
        path="/catalog"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              {activeCategory === 'all'
                ? t.catalog.title
                : `${getCategoryName(activeCategory)} - ${t.catalog.title}`}
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              {t.catalog.subtitle}
            </p>
          </div>

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

          <nav className="mx-auto mb-10 max-w-7xl overflow-x-hidden">
            <ul className="flex flex-wrap items-center gap-3 md:gap-5 w-[100%]">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('all')}
                  className={`px-2 md:px-3 py-1.5 text-sm md:text-base transition
                    border-b-2
                    ${activeCategory === 'all'
                      ? 'border-sky-500 text-sky-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
                  aria-pressed={activeCategory === 'all'}
                >
                  {t.catalog.allItems}
                </button>
              </li>

              {visibleCategories.map(cat => (
                <li key={cat.key}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat.key)}
                    className={`px-2 md:px-3 py-1.5 text-sm md:text-base transition
                      border-b-2
                      ${activeCategory === cat.key
                        ? 'border-sky-500 text-sky-700 font-semibold'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
                    aria-pressed={activeCategory === cat.key}
                  >
                    {getCategoryName(cat.key)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mb-12">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{t.catalog.noResults}</h3>
                <p className="mb-6 text-muted-foreground">
                  {searchTerm
                    ? t.catalog.noSearchResults
                    : t.catalog.noCategoryResults}
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

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedItems.map(item => (
                    <Card
                  key={item.id}
                  className="overflow-hidden transition-shadow hover:shadow-lg group flex flex-col"
                  style={{ height: '400px' }} // Fixed height for the entire card
                >
                  <div className="relative aspect-square overflow-hidden bg-accent/20">
                    <img
                      src={item.image}
                      alt={getTranslatedField(item.nameKey)}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/placeholder-product.jpg'
                      }}
                    />
                    <Badge className="absolute right-2 top-2">{getCategoryName(item.category)}</Badge>
                  </div>

                  <CardHeader className="pb-2 pt-4 flex-1" style={{ minHeight: '100px' }}>
                    <CardTitle
                      className="line-clamp-1 text-lg"
                      style={{ height: '24px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={getTranslatedField(item.nameKey)} // Tooltip for accessibility
                    >
                      {getTranslatedField(item.nameKey)}
                    </CardTitle>
                    <CardDescription
                      className="line-clamp-2 text-sm"
                      style={{ height: '40px', overflow: 'hidden' }}
                      title={getTranslatedField(item.descriptionKey)} // Tooltip for accessibility
                    >
                      {getTranslatedField(item.descriptionKey)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 flex flex-col justify-end" style={{ height: '100px' }}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <Button
                      className="w-full h-10 text-xs" // Reduced font size for better fit
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onClick={() => handleContactClick(item)}
                      title={t.catalog.contactCta} // Tooltip for accessibility
                    >
                      <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{t.catalog.contactCta}</span>
                    </Button>
                  </CardContent>
                </Card>
                  ))}
                </div>

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

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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

          <div className="h-[var(--catalog-bottom-gap)]" aria-hidden />
        </div>
      </section>
    </Layout>
  )
}