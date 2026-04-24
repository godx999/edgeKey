import { badRequestError } from "../../lib/app-error";
import type { PaymentProviderAdapter } from "./provider";

interface AlipayConfig {
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  notifyUrl?: string;
  returnUrl?: string;
}

const GATEWAY = "https://openapi.alipay.com/gateway.do";

function pemToBase64(pem: string) {
  return pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
}

async function rsaSign(content: string, privateKeyBase64: string): Promise<string> {
  const keyData = Uint8Array.from(atob(pemToBase64(privateKeyBase64)), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(content));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function rsaVerify(content: string, signBase64: string, publicKeyBase64: string): Promise<boolean> {
  try {
    const keyData = Uint8Array.from(atob(pemToBase64(publicKeyBase64)), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "spki",
      keyData,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const encoder = new TextEncoder();
    const sigData = Uint8Array.from(atob(signBase64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sigData, encoder.encode(content));
  } catch {
    return false;
  }
}

function buildSignString(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

export function createAlipayAdapter(config: AlipayConfig): PaymentProviderAdapter {
  return {
    async createPayment(input) {
      if (!config.alipayAppId || !config.alipayPrivateKey) {
        throw badRequestError("支付宝配置不完整", "ALIPAY_CONFIG_INCOMPLETE");
      }

      const method = input.paymentChannel === "pc" ? "alipay.trade.page.pay" : "alipay.trade.wap.pay";
      const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

      const bizContent = JSON.stringify({
        out_trade_no: input.orderNo,
        total_amount: (input.amount / 100).toFixed(2),
        subject: input.productName,
        product_code: input.paymentChannel === "pc" ? "FAST_INSTANT_TRADE_PAY" : "QUICK_WAP_WAY",
      });

      const params: Record<string, string> = {
        app_id: config.alipayAppId,
        method,
        charset: "utf-8",
        sign_type: "RSA2",
        timestamp,
        version: "1.0",
        notify_url: input.notifyUrl,
        return_url: input.returnUrl,
        biz_content: bizContent,
      };

      const signStr = buildSignString(params);
      const sign = await rsaSign(signStr, config.alipayPrivateKey);

      const query = new URLSearchParams({ ...params, sign }).toString();
      return {
        payUrl: `${GATEWAY}?${query}`,
        paymentOrderNo: input.orderNo,
        raw: params,
      };
    },

    async verifyNotify(payload) {
      if (!config.alipayPublicKey) {
        return { isValid: false, raw: payload, message: "missing alipay public key" };
      }

      const sign = payload.sign ?? "";
      const unsigned = { ...payload };
      delete unsigned.sign;
      delete unsigned.sign_type;

      const signStr = buildSignString(unsigned);
      const isValid = await rsaVerify(signStr, sign, config.alipayPublicKey);
      const tradeStatus = payload.trade_status ?? "";
      const isPaid = tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED";

      return {
        isValid,
        orderNo: payload.out_trade_no,
        paymentOrderNo: payload.trade_no,
        amount: payload.total_amount ? Math.round(Number(payload.total_amount) * 100) : undefined,
        status: isPaid ? "PAID" : tradeStatus ? "FAILED" : "PENDING",
        raw: payload,
        message: isValid ? "ok" : "invalid signature",
      };
    },
  };
}