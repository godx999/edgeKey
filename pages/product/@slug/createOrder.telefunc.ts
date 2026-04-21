import { createOrder } from "../../../modules/order/service";

export async function onCreateOrder(input: {
  productId: number;
  quantity: number;
  paymentProvider: "BEPUSDT" | "EPAY";
  paymentChannel?: string;
  contactType: "EMAIL";
  contactValue: string;
  buyerNote?: string;
}) {
  return createOrder(input);
}
