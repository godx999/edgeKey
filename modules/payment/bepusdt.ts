import { createHash } from "node:crypto";
import { badRequestError, externalServiceError } from "../../lib/app-error";
import type { PaymentProviderAdapter } from "./provider";

interface BepusdtConfig {
  baseUrl: string;
  appId?: string;
  appSecret?: string;
  notifyUrl?: string;
  returnUrl?: string;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function signBepusdt(payload: Record<string, string | number>, secret: string) {
  const base = Object.entries(payload)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("md5").update(`${base}${secret}`).digest("hex");
}

export function createBepusdtAdapter(config: BepusdtConfig): PaymentProviderAdapter {
  return {
    async createPayment(input) {
      if (!config.baseUrl || !config.appSecret) {
        throw badRequestError("BEpusdt 配置不完整", "BEPUSDT_CONFIG_INCOMPLETE");
      }

      const payload = {
        order_id: input.orderNo,
        amount: Number((input.amount / 100).toFixed(2)),
        notify_url: input.notifyUrl,
        redirect_url: input.returnUrl,
        name: input.productName,
      };

      const signature = signBepusdt(payload, config.appSecret);
      const response = await fetch(`${normalizeBaseUrl(config.baseUrl)}/api/v1/order/create-transaction`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          signature,
        }),
      });

      const json = (await response.json()) as {
        status_code?: number;
        message?: string;
        data?: {
          trade_id?: string;
          payment_url?: string;
        };
      };

      if (!response.ok || json.status_code !== 200 || !json.data?.payment_url) {
        throw externalServiceError(json.message || "BEpusdt 创建支付失败", "BEPUSDT_CREATE_PAYMENT_FAILED");
      }

      return {
        payUrl: json.data.payment_url,
        paymentOrderNo: json.data.trade_id,
        raw: json,
      };
    },

    async verifyNotify(payload) {
      if (!config.appSecret) {
        return {
          isValid: false,
          raw: payload,
          message: "missing app secret",
        };
      }

      const signature = payload.signature || "";
      const unsignedPayload = { ...payload };
      delete unsignedPayload.signature;
      const expected = signBepusdt(unsignedPayload, config.appSecret);
      const status = payload.status === "2" ? "PAID" : payload.status === "3" ? "FAILED" : "PENDING";

      return {
        isValid: signature === expected,
        orderNo: payload.order_id,
        paymentOrderNo: payload.trade_id,
        amount: payload.amount ? Math.round(Number(payload.amount) * 100) : undefined,
        status,
        raw: payload,
        message: signature === expected ? "ok" : "invalid signature",
      };
    },
  };
}
