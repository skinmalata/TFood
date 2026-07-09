import {
  UserRole,
  VendorStatus,
  OrderStatus,
  PaymentStatus,
  DisputeStatus,
  DeliveryMethod,
} from './enums';

export interface BaseUser {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Consumer extends BaseUser {
  role: UserRole.CONSUMER;
  defaultAddress?: string;
  latitude?: number;
  longitude?: number;
  savedCards?: SavedCard[];
}

export interface Vendor extends BaseUser {
  role: UserRole.VENDOR;
  businessName: string;
  businessAddress: string;
  latitude: number;
  longitude: number;
  status: VendorStatus;
  cuisineType: string;
  description: string;
  coverImageUrl?: string;
  logoUrl?: string;
  deliveryRadius: number;
  preparationTime: number;
  isOpen: boolean;
  openingHours?: string;
  closingHours?: string;
  rating: number;
  totalOrders: number;
  documents?: VendorDocument[];
}

export interface Admin extends BaseUser {
  role: UserRole.ADMIN;
  permissions: string[];
}

export interface VendorDocument {
  id: number;
  vendorId: number;
  type: 'cac' | 'nafdac' | 'identity' | 'utility_bill' | 'other';
  fileUrl: string;
  verifiedAt?: string;
  verifiedBy?: number;
}

export interface SavedCard {
  id: number;
  userId: number;
  authorizationCode: string;
  last4: string;
  brand: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

export interface MenuItem {
  id: number;
  vendorId: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
  preparationTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  consumerId: number;
  vendorId: number;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
}

export interface ChatMessage {
  id: number;
  orderId: number;
  senderId: number;
  senderRole: UserRole;
  messageType: 'text' | 'voice' | 'image';
  content: string;
  voiceUrl?: string;
  imageUrl?: string;
  duration?: number;
  isRead: boolean;
  createdAt: string;
}

export interface VoiceCall {
  id: number;
  orderId: number;
  callerId: number;
  receiverId: number;
  callSid: string;
  duration: number;
  status: 'initiated' | 'ongoing' | 'completed' | 'missed';
  startedAt?: string;
  endedAt?: string;
}

export interface Review {
  id: number;
  orderId: number;
  consumerId: number;
  vendorId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Dispute {
  id: number;
  orderId: number;
  raisedBy: number;
  raisedByRole: UserRole;
  reason: string;
  description: string;
  status: DisputeStatus;
  adminNotes?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: number;
  orderId: number;
  userId: number;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: 'paystack' | 'flutterwave';
  gatewayResponse?: any;
  paidAt?: string;
  createdAt: string;
}

export interface DeliveryEstimate {
  vendorId: number;
  distanceKm: number;
  estimatedMinutes: number;
  deliveryFee: number;
}

export interface NearbyVendor {
  vendor: Vendor;
  distanceKm: number;
  menuItems: MenuItem[];
  deliveryEstimate: DeliveryEstimate;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
