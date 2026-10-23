import {useEffect, useRef, useState} from "react";

interface PayPalButtonData {
  orderID: string;
}

interface PayPalButtonOptions {
  createOrder: () => Promise<string>;
  onApprove: (data: PayPalButtonData) => Promise<void>;
  onError: (error: unknown) => void;
  style: {layout: "vertical"; shape: "rect"; label: "paypal"; tagline: false};
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: PayPalButtonOptions) => {render: (container: HTMLElement) => Promise<void>};
    };
  }
}

let paypalSdkLoad: Promise<void> | null = null;

function loadPayPalSdk(clientId: string): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (paypalSdkLoad) return paypalSdkLoad;

  paypalSdkLoad = new Promise((resolve, reject) => {
    const existing = document.getElementById("paypal-checkout-sdk") as HTMLScriptElement | null;
    const script = existing || document.createElement("script");
    script.id = "paypal-checkout-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => window.paypal ? resolve() : reject(new Error("PayPal checkout did not load."));
    script.onerror = () => reject(new Error("PayPal checkout could not load."));
    if (!existing) document.body.appendChild(script);
  }).catch((error: unknown) => {
    paypalSdkLoad = null;
    throw error;
  });
  return paypalSdkLoad;
}

export default function PayPalCheckoutButton({
  createOrder,
  onApprove,
  onError,
}: {
  createOrder: () => Promise<string>;
  onApprove: (data: PayPalButtonData) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({createOrder, onApprove, onError});
  const [loading, setLoading] = useState(true);
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    callbacksRef.current = {createOrder, onApprove, onError};
  }, [createOrder, onApprove, onError]);

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      setLoading(false);
      return;
    }

    let active = true;
    const container = containerRef.current;
    void loadPayPalSdk(clientId).then(() => {
      if (!active || !container || !window.paypal) return;
      setLoading(false);
      return window.paypal.Buttons({
        createOrder: () => callbacksRef.current.createOrder(),
        onApprove: (data) => callbacksRef.current.onApprove(data),
        onError: (error) => callbacksRef.current.onError(error),
        style: {layout: "vertical", shape: "rect", label: "paypal", tagline: false},
      }).render(container);
    }).catch((error: unknown) => {
      if (active) {
        setLoading(false);
        onError(error);
      }
    });

    return () => {
      active = false;
      container.innerHTML = "";
    };
  }, [clientId]);

  if (!clientId) return <p className="text-sm text-red-700">PayPal checkout is not configured yet.</p>;
  return <div>
    {loading && <p className="mb-2 text-center text-xs text-slate-500">Loading secure PayPal checkout…</p>}
    <div ref={containerRef} />
  </div>;
}
