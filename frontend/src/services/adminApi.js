const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const TOKEN_KEY = "garba_admin_token";
const ADMIN_KEY = "garba_admin";

const notifyAuthChange = () => {
  window.dispatchEvent(new CustomEvent("garba-admin-auth-changed"));
};

export const getAdminToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredAdmin = () => {
  try {
    const admin = localStorage.getItem(ADMIN_KEY);

    return admin ? JSON.parse(admin) : null;
  } catch {
    return null;
  }
};

export const saveAdminAuth = (token, admin) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));

  notifyAuthChange();
};

export const saveAdminToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChange();
};

export const updateStoredAdmin = (admin) => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));

  notifyAuthChange();
};

export const clearAdminAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);

  notifyAuthChange();
};

export const removeAdminToken = clearAdminAuth;

export const isAdminAuthenticated = () => {
  return Boolean(getAdminToken());
};

export const hasAdminToken = isAdminAuthenticated;

const parseResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const adminRequest = async (endpoint, options = {}) => {
  const token = getAdminToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminAuth();
    }

    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const getAdminOrders = async ({
  status = "",
  search = "",
  page = 1,
  limit = 20,
} = {}) => {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  if (search) {
    params.set("search", search);
  }

  params.set("page", page);
  params.set("limit", limit);

  return adminRequest(`/admin/orders?${params.toString()}`);
};

export const getAdminOrderById = async (orderId) => {
  return adminRequest(`/admin/orders/${orderId}`);
};

export const getAdminCheckins = async ({
  result = "",
  search = "",
  page = 1,
  limit = 30,
} = {}) => {
  const params = new URLSearchParams();

  if (result) {
    params.set("result", result);
  }

  if (search) {
    params.set("search", search);
  }

  params.set("page", page);
  params.set("limit", limit);

  return adminRequest(`/admin/checkins?${params.toString()}`);
};

export const scanAdminTicket = async (qrToken) => {
  return adminRequest("/admin/scanner/scan", {
    method: "POST",
    body: JSON.stringify({
      qrToken,
    }),
  });
};

/*
 * ---------------------------------------------------------
 * ADMIN LOGIN
 * ---------------------------------------------------------
 */

export const loginAdmin = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  const token = data?.data?.token;
  const admin = data?.data?.admin;

  if (!token || !admin) {
    throw new Error("Invalid login response from server");
  }

  saveAdminAuth(token, admin);

  return data;
};

export const adminLogin = loginAdmin;

/*
 * ---------------------------------------------------------
 * CURRENT ADMIN
 * ---------------------------------------------------------
 */

export const getCurrentAdmin = async () => {
  return adminRequest("/admin/auth/me");
};

/*
 * ---------------------------------------------------------
 * DASHBOARD
 * ---------------------------------------------------------
 */

export const getDashboardStats = async () => {
  return adminRequest("/admin/dashboard");
};

export const getAdminPasses = async () => {
  return adminRequest("/admin/passes");
};

export const createAdminPass = async (passData) => {
  return adminRequest("/admin/passes", {
    method: "POST",
    body: JSON.stringify(passData),
  });
};

export const updateAdminPass = async (passId, updates) => {
  return adminRequest(`/admin/passes/${encodeURIComponent(passId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

export const deleteAdminPass = async (passId) => {
  return adminRequest(`/admin/passes/${encodeURIComponent(passId)}`, {
    method: "DELETE",
  });
};

/*
 * ---------------------------------------------------------
 * LOGOUT
 * ---------------------------------------------------------
 */

export const logoutAdmin = () => {
  clearAdminAuth();
};

export const scanTicket = async (qrToken) => {
  return adminRequest("/checkins/scan", {
    method: "POST",
    body: JSON.stringify({ qrToken }),
  });
};
