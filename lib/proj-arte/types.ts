export type ActivityType = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  activityTypeSlug: string;
  priceCents: number;
  priceLabel: string;
  pdfUrl: string | null;
  coverImageUrl: string | null;
  galleryUrls: string[];
  featured: boolean;
  active: boolean;
  checkoutUrl: string | null;
  stripeProductId: string | null;
  stripePriceId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
