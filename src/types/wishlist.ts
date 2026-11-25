export interface UserAccount {
  accountId: string;
  displayName: string;
  authorizedUids: string[];
  createdGroupCodes: string[];
  joinedGroupCodes: string[];
  createdAt: string;
}

export interface FamilyGroup {
  code: string;
  name: string;
  expectedMembers: number;
  creatorUid: string;
  creatorName?: string;
  creatorAccountId?: string;
  createdAt: string;
}

export interface MemberProfile {
  id: string;
  member: string;
  ownerUid: string;
  accountId?: string;
  familyCode: string;
  casaca: string;
  polo: string;
  chompa: string;
  pantalon: string;
  zapatillas: string;
  notas?: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  price?: string;
  favicon?: string;
}

export interface WishItem {
  id: string;
  memberId: string;
  member: string;
  ownerUid: string;
  accountId?: string;
  familyCode: string;
  wish: string;
  description: string;
  productUrl: string;
  linkTitle: string;
  linkImage: string;
  linkSite: string;
  linkDesc?: string;
  linkPrice?: string;
  photoId?: string;
  reservedAnonymously: boolean;
  isFavorite?: boolean;
  createdAt: string;
}

export interface CompressedPhoto {
  dataUrl: string;
  fileName: string;
  sizeBytes: number;
}
