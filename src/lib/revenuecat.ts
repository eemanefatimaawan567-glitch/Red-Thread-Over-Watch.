import {
  ErrorCode,
  Purchases,
  PurchasesError,
  type CustomerInfo,
  type Package,
} from '@revenuecat/purchases-js';

const ENTITLEMENT_ID = 'agent_pass';
const PACKAGE_ID = 'agent_wardrobe';
const USER_ID_STORAGE_KEY = 'red-thread-revenuecat-user-id';

export type WardrobeStoreState = {
  configured: boolean;
  available: boolean;
  unlocked: boolean;
  price: string;
  package: Package | null;
  message: string;
};

const unavailableState = (message: string): WardrobeStoreState => ({
  configured: false,
  available: false,
  unlocked: false,
  price: '$3.99',
  package: null,
  message,
});

function hasWardrobeEntitlement(customerInfo: CustomerInfo) {
  return ENTITLEMENT_ID in customerInfo.entitlements.active;
}

function getOrCreateAppUserId() {
  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) return existing;
  const generated = Purchases.generateRevenueCatAnonymousAppUserId();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, generated);
  return generated;
}

function getPurchases() {
  // Put your actual RevenueCat API key right here inside the quotes:
  const apiKey = 'test_pAFaElZClbNhiySpfDoKyLLTktg'.trim(); 
  
  if (!apiKey) return null;
  if (Purchases.isConfigured()) return Purchases.getSharedInstance();
  return Purchases.configure({ apiKey, appUserId: getOrCreateAppUserId() });
}

export async function loadWardrobeStore(): Promise<WardrobeStoreState> {
  try {
    const purchases = getPurchases();
    if (!purchases) {
      return unavailableState('Add VITE_REVENUECAT_API_KEY to enable Test Store purchases.');
    }
    const [customerInfo, offerings] = await Promise.all([
      purchases.getCustomerInfo(),
      purchases.getOfferings({ currency: 'USD' }),
    ]);
    const wardrobePackage = offerings.current?.packagesById[PACKAGE_ID] ?? null;
    return {
      configured: true,
      available: Boolean(wardrobePackage),
      unlocked: hasWardrobeEntitlement(customerInfo),
      price: wardrobePackage?.webBillingProduct.currentPrice.formattedPrice ?? '$3.99',
      package: wardrobePackage,
      message: wardrobePackage ? 'Test Store ready' : 'The agent_wardrobe package was not found.',
    };
  } catch (error) {
    return unavailableState(error instanceof Error ? error.message : 'RevenueCat could not be reached.');
  }
}

export async function purchaseWardrobe(rcPackage: Package) {
  const purchases = getPurchases();
  if (!purchases) throw new Error('RevenueCat API key is missing.');
  try {
    const result = await purchases.purchase({ rcPackage });
    return hasWardrobeEntitlement(result.customerInfo);
  } catch (error) {
    if (error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError) {
      return false;
    }
    throw error;
  }
}

export async function restoreWardrobeAccess(): Promise<boolean> {
  const purchases = getPurchases();
  if (!purchases) throw new Error('RevenueCat API key is missing.');
  // Web purchases follow the stable app user ID. Fetching fresh CustomerInfo
  // restores the entitlement associated with that identity on this browser.
  const customerInfo = await purchases.getCustomerInfo();
  return hasWardrobeEntitlement(customerInfo);
}
