// Shared type definitions for Campus Marketplace

// User data interface
export interface UserData {
  userName: string;
  displayName: string;
  profilePicture: string;
  schoolName: string;
  sellerRating: number;
  buyerRating: number;
}

// Listing data interface
export interface ListingData {
  listingId: string;
  userId: string;
  description: string;
  timeCreated: Date;
  condition: string;
  photos: string[];
  location: string;
  price: number;
  sold: boolean;
  quantity: number;
  category: string[];
}
