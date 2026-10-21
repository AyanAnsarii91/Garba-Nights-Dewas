const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const getEventBySlug = async (slug) => {
  return apiRequest(`/events/${slug}`);
};
export const createPaymentOrder = async (orderId) => {
  return apiRequest("/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
};

export const verifyPayment = async (paymentData) => {
  return apiRequest("/payments/verify", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};

export const reconcilePayment = async (orderId) => {
  return apiRequest("/payments/reconcile", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
};

export const getOrderById = async (orderId) => {
  return apiRequest(`/orders/${orderId}`);
};

export const getTicketByNumber = async (ticketNumber) => {
  return apiRequest(`/tickets/${encodeURIComponent(ticketNumber)}`);
};

export const getTicketsByOrder = async (orderId) => {
  return apiRequest(`/tickets/order/${encodeURIComponent(orderId)}`);
};

export const createOrder = async (orderData) => {
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
};
