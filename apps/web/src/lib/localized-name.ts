/**
 * Returns the localized name for any entity that has name + name_ar fields.
 * Falls back to whichever name is available.
 */
export function localizedName(
  item: { name?: string; name_ar?: string } | null | undefined,
  locale: 'en' | 'ar' = 'en'
): string {
  if (!item) return '';
  if (locale === 'ar') {
    return item.name_ar || item.name || '';
  }
  return item.name || item.name_ar || '';
}

/**
 * For order items / line items that store denormalized name + name_ar
 */
export function localizedItemName(
  item: { name?: string; name_ar?: string; product_name?: string } | null | undefined,
  locale: 'en' | 'ar' = 'en'
): string {
  if (!item) return '';
  if (locale === 'ar') {
    return item.name_ar || item.name || item.product_name || '';
  }
  return item.name || item.name_ar || item.product_name || '';
}
