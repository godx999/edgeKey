import { assertAdminAccess } from "../../../modules/auth/service";
import { activateEmailProvider, saveEmailConfig, saveEmailPushSettings } from "../../../modules/email/service";

export async function onSaveEmailConfig(input: Record<string, unknown>) {
  assertAdminAccess();
  return saveEmailConfig(input as any);
}

export async function onSaveEmailPushSettings(input: {
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
}) {
  assertAdminAccess();
  return saveEmailPushSettings(input);
}

export async function onActivateEmailProvider(provider: "API" | "SMTP" | "CLOUDFLARE") {
  assertAdminAccess();
  return activateEmailProvider(provider);
}
