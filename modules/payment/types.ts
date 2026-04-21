export interface PaymentMethodItem {
  provider: "BEPUSDT" | "EPAY";
  label: string;
  enabled: boolean;
  baseUrl?: string;
}

export interface PaymentConfigValue {
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
}
