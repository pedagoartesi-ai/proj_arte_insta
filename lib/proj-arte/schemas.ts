import { z } from "zod";

export const productInputSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(3),
  description: z.string().optional().default(""),
  activityTypeSlug: z.string().min(2),
  priceCents: z.number().int().nonnegative(),
  priceLabel: z.string().optional(),
  pdfUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  checkoutUrl: z.string().url().nullable().optional(),
  stripeProductId: z.string().nullable().optional(),
  stripePriceId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(8),
  category: z.string().optional().default("all"),
  search: z.string().optional().default(""),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive().max(10).default(1),
      }),
    )
    .min(1),
  buyerEmail: z.string().email(),
  buyerEmailVerificationToken: z.string().min(1),
  embedded: z.boolean().default(true),
  returnUrl: z.string().url().optional(),
});

export const buyerEmailRequestSchema = z.object({
  email: z.string().email(),
});

export const buyerEmailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  requestToken: z.string().min(1),
});

export const uploadSignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(3),
  folder: z.string().min(1).default("products"),
});
