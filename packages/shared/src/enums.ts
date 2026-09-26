export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum StockType {
  SEED = 'SEED',
  FERTILIZER = 'FERTILIZER',
  PESTICIDE = 'PESTICIDE',
  PRODUCT = 'PRODUCT',
}

export enum StockMovementLevel {
  IN = 'IN',
  OUT = 'OUT',
}

export enum SupportStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  HARVEST_REMINDER = 'HARVEST_REMINDER',
  ACTIVITY_REMINDER = 'ACTIVITY_REMINDER',
  SUPPORT_REPLY = 'SUPPORT_REPLY',
  SYSTEM = 'SYSTEM',
}
