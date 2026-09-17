import { loadStripe } from "@stripe/stripe-js";

export const stripePublishableKey = import.meta.env["VITE_STRIPE_PUBLISHABLE_KEY"] as string | undefined;
export const stripePromise = loadStripe(stripePublishableKey || "pk_test_placeholder");
