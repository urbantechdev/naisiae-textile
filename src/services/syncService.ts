import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface StagingProductPayload {
  tenantId: string;
  tenantSlug: string;
  offerId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  price: number;
  currency: string;
  priceString: string;
  availability: 'in stock' | 'out of stock';
  syncedAt: any;
}

/**
 * Clean description string from HTML tags to ensure compliance with product listing standards.
 */
function cleanDescription(text: string): string {
  if (!text) return '';
  // Strip HTML tag brackets
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Synchronizes a product's lifecycle event with the UrbanTechDev staging database collection.
 * Supports:
 * - onProductCreate
 * - onProductUpdate
 * - onProductDelete
 * 
 * @param action The lifecycle action triggering the synchronization.
 * @param productId The Firestore unique document identifier.
 * @param productData The product data payload.
 */
export async function syncProductToStaging(
  action: 'create' | 'update' | 'delete',
  productId: string,
  productData?: any
) {
  try {
    const docRef = doc(db, 'staging_products', productId);

    if (action === 'delete') {
      console.log(`[SYNC ENGINE] onProductDelete triggered for ID: ${productId}`);
      await deleteDoc(docRef);
      console.log(`[SYNC ENGINE] Successfully removed product ${productId} from staging collection.`);
      return { success: true, action, productId };
    }

    if (!productData) {
      throw new Error('Product data must be provided for create or update events.');
    }

    console.log(`[SYNC ENGINE] onProduct${action === 'create' ? 'Create' : 'Update'} triggered for ID: ${productId}`);

    // Construct deterministic SKU/offerId if not present (e.g., NAIS-AN-442)
    const offerId = productData.sku || `NAIS-AN-${productId.slice(0, 6).toUpperCase()}`;

    // Clean description: plain text, no raw HTML fragments
    const cleanedDesc = cleanDescription(productData.description || 'Quality textiles and institutional school apparel.');

    // Absolute product checkout/landing page URL on live storefront website
    const liveStorefrontUrl = 'https://naisiaetextiles.com';
    const link = `${liveStorefrontUrl}/product/${productId}`;

    // Primary product photo url (full absolute link)
    const imageLink = productData.imageUrl || 
                      (productData.imageUrls && productData.imageUrls[0]) || 
                      'https://images.unsplash.com/photo-1520004481444-222474c50db4?q=80&w=600';

    // Pricing parsing
    const parsedPrice = parseFloat(productData.price) || 0;
    const currency = 'KES';
    const priceString = `${parsedPrice.toFixed(2)} ${currency}`;

    // Availability validation matching strict enum: "in stock" or "out of stock"
    const hasAvailability = productData.active !== false && (productData.stock === undefined || productData.stock > 0);
    const availability = hasAvailability ? 'in stock' : 'out of stock';

    // Construct the compliant payload matrix
    const payload: StagingProductPayload = {
      tenantId: 'naisiaetextiles_prod_01',
      tenantSlug: 'naisiaetextiles_prod_01',
      offerId,
      title: productData.name || 'Unnamed Product',
      description: cleanedDesc,
      link,
      imageLink,
      price: parsedPrice,
      currency,
      priceString,
      availability,
      syncedAt: serverTimestamp()
    };

    // Perform direct write transaction to the staging database collection
    await setDoc(docRef, payload, { merge: true });

    // Stream/POST log payload for server simulation or external tracking pool
    console.log('[SYNC ENGINE] Staging update payload successfully written:', JSON.stringify(payload));

    return { success: true, action, productId, offerId };
  } catch (error) {
    console.error(`[SYNC ENGINE] Critical synchronization failure for action ${action}:`, error);
    // Suppress throwing error to ensure storefront transactions/admin actions do not block on sync failure
    return { success: false, error: String(error) };
  }
}
