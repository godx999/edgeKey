import { assertAdminAccess } from "../../../modules/auth/service";
import { savePaymentConfig } from "../../../modules/payment/service";

export async function onSavePaymentConfig(input: {
  provider: "BEPUSDT" | "EPAY";
  name: string;
  isEnabled: boolean;
  baseUrl: string;
  appId?: string;
  appSecret?: string;
  pid?: string;
  key?: string;
  notifyUrl?: string;
  returnUrl?: string;
}) {
  assertAdminAccess();
  return savePaymentConfig(input);
}
