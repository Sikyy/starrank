import type { RankableListing } from '../domain/ranking'
import type { Category } from '../domain/category'

export interface Listing extends RankableListing {
  description: string
  domain: string
  href: string
  image: string | null
  clicks: number
  age: string
  category: Category
}
