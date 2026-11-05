import {useState} from "react";

export interface PesapalOrder {
  redirectUrl: string;
}

/**
 * Starts a Pesapal order on the server, then sends the customer to Pesapal's
 * hosted checkout. Consumer credentials must never be passed to this component.
 */
export default function PesapalCheckoutButton({
  createOrder,
  onError,
  email,
  requireEmail = false,
  disabled = false,
  label = "Pay with Pesapal",
}: {
  createOrder: () => Promise<PesapalOrder>;
  onError: (error: unknown) => void;
  email?: string;
  requireEmail?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || "");
  const emailBlocksCheckout = requireEmail && !isEmailValid;

  const startCheckout = async () => {
    if (loading || disabled || emailBlocksCheckout) return;
    setLoading(true);
    try {
      const order = await createOrder();
      const redirectUrl = new URL(order.redirectUrl);
      if (redirectUrl.protocol !== "https:" || !/(^|\.)pesapal\.com$/i.test(redirectUrl.hostname)) {
        throw new Error("Pesapal returned an invalid checkout URL.");
      }
      window.location.assign(redirectUrl.toString());
    } catch (error) {
      setLoading(false);
      onError(error);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={disabled || loading || emailBlocksCheckout}
        aria-describedby={requireEmail ? "pesapal-email-hint" : undefined}
        className="w-full rounded-xl bg-[#2C6E9E] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#16324A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Connecting to Pesapal..." : label}
      </button>
      {emailBlocksCheckout && (
        <p id="pesapal-email-hint" className="mt-1 text-center text-xs text-slate-500" role="status">
          Enter a valid email address to continue with Pesapal.
        </p>
      )}
    </div>
  );
}
