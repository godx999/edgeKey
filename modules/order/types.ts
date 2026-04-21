export interface CreateOrderInput {
  productId: number;
  quantity: number;
  paymentProvider: "BEPUSDT" | "EPAY";
  contactType: "EMAIL" | "QQ" | "TELEGRAM" | "OTHER";
  contactValue?: string;
  buyerNote?: string;
}
