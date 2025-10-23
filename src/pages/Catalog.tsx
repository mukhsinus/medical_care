'use client'

import { useEffect, useState } from 'react'
import {
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Layout } from '@/components/Layout'
import { SEO } from '@/components/SEO'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Search, ChevronLeft, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

import categoryInjection from '@/assets/category-injection.png'
import categoryEquipment from '@/assets/category-equipment.png'
import categorySurgery from '@/assets/category-surgery.png'
import categoryhygiene from '@/assets/category-hygiene.png'
import categoryDressings from '@/assets/sterilization.png'
import categoryLab from '@/assets/lab.png'
import { get } from 'http'
const itemsImg = import.meta.glob('@/assets/items/*.{png,jpg,jpeg,webp}', { eager: true });
const getImage = (filename: string) => {
  return itemsImg[`/src/assets/items/${filename}`]?.default;
};

type CatalogItem = {
  id: number
  category: string
  name: string
  description: string
  price: number
  image: string
}

/* --------------------------------------------------- */
/* ------------------- SAMPLE DATA ------------------- */
/* --------------------------------------------------- */
const allItems: CatalogItem[] = [
  { id: 1, category: 'injection', name: 'Insulin Syringes 1ml', description: 'High-quality insulin syringes', price: 2.5,image: getImage('insulin-syringe.webp') },
  { id: 2, category: 'injection', name: 'Hypodermic Needles 21G', description: 'Sterile needles', price: 0.8, image: getImage('hypodemic_21.webp') },
  { id: 3, category: 'injection', name: 'IV Cannula 20G', description: 'Intravenous cannula', price: 1.2, image: getImage('cannula_20.png') },
  { id: 4, category: 'equipment', name: 'Digital Thermometer', description: 'Accurate digital thermometer', price: 15, image: getImage('dig_thermometer.webp') },
  { id: 5, category: 'equipment', name: 'Blood Pressure Monitor', description: 'Automatic monitor', price: 45, image: getImage('blood-pressure.png') },
  { id: 6, category: 'equipment', name: 'Stethoscope Littmann', description: 'Premium cardiology stethoscope', price: 120, image: getImage('stethoscope.png') },
  { id: 7, category: 'surgery', name: 'Surgical Scalpel #11', description: 'Precision blade', price: 3.5, image: getImage('scalpel-11.png') },
  { id: 8, category: 'surgery', name: 'Surgical Forceps', description: 'Sterile forceps', price: 8, image: getImage('forceps.webp') },
  { id: 9, category: 'surgery', name: 'Suture Kit', description: 'Complete suture kit', price: 12, image: getImage('suture.webp') },
  { id: 10, category: 'hygiene', name: 'Alcohol 70% 500ml', description: 'Medical disinfectant', price: 5, image: getImage('alcohol.png') },
  { id: 11, category: 'hygiene', name: 'Hand Sanitizer 100ml', description: 'Portable sanitizer', price: 3.2, image: getImage('sanitizer.png') },
  { id: 12, category: 'hygiene', name: 'PPE Kit', description: 'Full protective kit', price: 25, image: getImage('ppe.png') },
  { id: 13, category: 'dressings', name: 'Gauze Bandages 10cm', description: 'Sterile gauze', price: 4.5, image: getImage('gauze.png') },
  { id: 14, category: 'dressings', name: 'Adhesive Bandages', description: 'Assorted bandages', price: 2, image: getImage('adhesive.png') },
  { id: 15, category: 'dressings', name: 'Hydrocolloid Dressings', description: 'Advanced healing', price: 18, image: getImage('hydrocolloid.png') },
  { id: 16, category: 'lab', name: 'Test Tubes 10ml', description: 'Glass test tubes', price: 1.5, image: getImage('test-tube.webp') },
  { id: 17, category: 'lab', name: 'Pipettes 1ml', description: 'Disposable pipettes', price: 0.3, image: getImage('pipette.webp') },
  { id: 18, category: 'lab', name: 'Microscope Slides', description: 'Pre-cleaned slides', price: 6, image: getImage('slides.png') },
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

/* --------------------------------------------------- */
/* ------------------- COMPONENT --------------------- */
/* --------------------------------------------------- */
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
  }, [searchParams])

  /* ---------- filter logic ---------- */
  const filterItems = (cat: string, srch: string) => {
    let list = allItems
    if (cat !== 'all') list = list.filter(i => i.category === cat)
    if (srch.trim())
      list = list.filter(
        i =>
          i.name.toLowerCase().includes(srch.toLowerCase()) ||
          i.description.toLowerCase().includes(srch.toLowerCase())
      )
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
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchTerm(val)
    setCurrentPage(1)
    updateUrl(activeCategory, val, 1)
    filterItems(activeCategory, val)
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
      ? `Inquiry about ${item.name}`
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
  return (
    <Layout>
      <SEO
        title={`${getCategoryName(activeCategory)} - ${t.catalog.title}`}
        description={t.catalog.subtitle}
        path="/catalog"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
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

          {/* Search Bar */}
          <div className="mx-auto mb-6 max-w-md">
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
          </div>

          {/* Breadcrumb – Mobile Only, After Search, No Overlap */}
          <div className="mb-6 md:hidden z-10 pb-8">
            <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm">
              <a
                href="/catalog"
                onClick={(e) => {
                  e.preventDefault()
                  handleCategoryClick('all')
                }}
                className="hover:underline"
              >
                {t.catalog.title}
              </a>

              {activeCategory !== 'all' && (
                <>
                  <span className="px-1 text-muted-foreground">/</span>
                  <span className="font-medium text-foreground">
                    {getCategoryName(activeCategory)}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Category Navigation – Always on Desktop, Only on Mobile when 'all' */}
          {(activeCategory === 'all' || window.innerWidth >= 768) && (
            <div className="mb-12">
              <h2 className="mb-6 flex items-center text-2xl font-semibold">
                <Filter className="mr-2 h-5 w-5" />
                {t.catalog.categories}
              </h2>

              <div className={`grid gap-4 ${
                activeCategory === 'all' 
                  ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4'  // 4 per row when 'all'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'  // 6 per row when category selected
              }`}>
                {categories.map(cat => (
                  <Button
                    key={cat.key}
                    variant={activeCategory === cat.key ? 'default' : 'outline'}
                    className={`flex-col gap-2 p-3 ${
                      activeCategory === 'all'
                        ? 'h-32'  // Bigger height when 'all'
                        : 'h-20'  // Normal height when category selected
                    } ${activeCategory === cat.key
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'hover:bg-accent'
                    }`}
                    onClick={() => handleCategoryClick(cat.key)}
                  >
                    {'icon' in cat ? (
                      <span className={`text-3xl ${
                        activeCategory === 'all' ? 'mb-1' : 'mb-0'
                      }`}>{cat.icon}</span>
                    ) : (
                      <img
                        src={cat.image}
                        alt={getCategoryName(cat.key)}
                        className={`mx-auto object-contain ${
                          activeCategory === 'all' 
                            ? 'h-16 w-16'  // Bigger images when 'all'
                            : 'h-12 w-12'  // Normal images when category selected
                        }`}
                      />
                    )}
                    <span className="text-center text-xs font-medium leading-tight">
                      {getCategoryName(cat.key)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Items + Pagination */}
          <div className="mb-12">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{t.catalog.noResults}</h3>
                <p className="mb-6 text-muted-foreground">
                  {searchTerm
                    ? `No products match "${searchTerm}"`
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

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedItems.map(item => (
                    <Card
                      key={item.id}
                      className="overflow-hidden transition-shadow hover:shadow-lg group"
                    >
                      <div className="relative aspect-square overflow-hidden bg-accent/20">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={e => {
                            e.currentTarget.src = '/images/placeholder-product.jpg'
                          }}
                        />
                        <Badge className="absolute right-2 top-2">{item.category}</Badge>
                      </div>

                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="line-clamp-1 text-lg">{item.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {item.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <Button className="w-full" onClick={() => handleContactClick(item)}>
                          <Mail className="mr-2 h-4 w-4" />
                          {t.catalog.inquire}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
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

          {/* bottom gap */}
          <div className="h-[var(--catalog-bottom-gap)]" aria-hidden />
        </div>
      </section>
    </Layout>
  )
}