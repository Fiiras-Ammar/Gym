// Django API Client - Replaces Supabase
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Token storage
const getTokens = () => ({
  access: localStorage.getItem("access_token"),
  refresh: localStorage.getItem("refresh_token"),
});

const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};

const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// Base request function
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  const { access } = getTokens();

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    // Don't set Content-Type for FormData - browser sets it with boundary
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(access && { Authorization: `Bearer ${access}` }),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry request
      return apiRequest(endpoint, options);
    }
    clearTokens();
    window.location.href = "/auth";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.detail || "Request failed");
  }

  if (response.status === 204) return null;
  
  const data = await response.json();
  
  // Unwrap Django REST Framework paginated responses
  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return data.results;
  }
  
  return data;
}

// Refresh token
async function refreshToken(): Promise<boolean> {
  const { refresh } = getTokens();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access);
      return true;
    }
  } catch {
    // Silent fail
  }
  return false;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiRequest("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.access, data.refresh);
    return data;
  },

  logout: async () => {
    const { refresh } = getTokens();
    if (refresh) {
      await apiRequest("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }).catch(() => {});
    }
    clearTokens();
  },

  getUser: () => apiRequest("/users/me/"),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiRequest("/users/change_password/", {
      method: "POST",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  changeEmail: (newEmail: string) =>
    apiRequest("/users/change_email/", {
      method: "POST",
      body: JSON.stringify({ new_email: newEmail }),
    }),
};

// Profile API
export const profileApi = {
  get: () => apiRequest("/profiles/me/"),
  update: (data: { display_name?: string; avatar_url?: string }) =>
    apiRequest("/profiles/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const { access } = getTokens();
    const response = await fetch(`${API_URL}/upload-avatar/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  },
};

// Settings API
export const settingsApi = {
  get: () => apiRequest("/settings/"),
  update: (id: string, data: Partial<Settings>) =>
    apiRequest(`/settings/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Products API
export const productsApi = {
  list: () => apiRequest("/products/"),
  get: (id: string) => apiRequest(`/products/${id}/`),
  create: (data: Omit<Product, "id" | "created_at">) =>
    apiRequest("/products/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Product>) =>
    apiRequest(`/products/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest(`/products/${id}/`, { method: "DELETE" }),
  uploadImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest(`/products/${id}/upload-image/`, {
      method: "POST",
      body: formData,
    });
  },
};

// Consumption Logs API
export const logsApi = {
  list: (params?: { from?: string; to?: string }) => {
    const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return apiRequest(`/consumption-logs/${query}`);
  },
  today: () => apiRequest("/consumption-logs/today/"),
  create: (data: { product_id: string; amount: number; consumed_at?: string }) =>
    apiRequest("/consumption-logs/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { amount?: number }) =>
    apiRequest(`/consumption-logs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/consumption-logs/${id}/`, { method: "DELETE" }),
};

// Exercise Categories API
export const categoriesApi = {
  list: () => apiRequest("/exercise-categories/"),
  create: (data: { name: string; color?: string }) =>
    apiRequest("/exercise-categories/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/exercise-categories/${id}/`, { method: "DELETE" }),
};

// Workout Days API
export const workoutDaysApi = {
  list: () => apiRequest("/workout-days/"),
  create: (data: { name: string; day_of_week?: number | null; category_id?: string | null }) =>
    apiRequest("/workout-days/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/workout-days/${id}/`, { method: "DELETE" }),
};

// Workout Exercises API
export const workoutExercisesApi = {
  list: (dayId?: string) => {
    const query = dayId ? `?workout_day=${dayId}` : "";
    return apiRequest(`/workout-exercises/${query}`);
  },
  create: (data: {
    workout_day_id: string;
    exercise_id: string;
    name: string;
    gif_url?: string;
    video_url?: string;
    body_part?: string;
    target?: string;
    equipment?: string;
    position?: number;
  }) =>
    apiRequest("/workout-exercises/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/workout-exercises/${id}/`, { method: "DELETE" }),
};

// Workout Completions API
export const completionsApi = {
  list: () => apiRequest("/workout-completions/"),
  today: () => apiRequest("/workout-completions/today/"),
  create: (data: { workout_day_id: string; completed_at?: string }) =>
    apiRequest("/workout-completions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/workout-completions/${id}/`, { method: "DELETE" }),
};

// Weight Logs API
export const weightApi = {
  list: () => apiRequest("/weight-logs/"),
  create: (data: { weight_kg: number; logged_at?: string; note?: string }) =>
    apiRequest("/weight-logs/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { weight_kg?: number; note?: string }) =>
    apiRequest(`/weight-logs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/weight-logs/${id}/`, { method: "DELETE" }),
};

// ExerciseDB API (external, already public)
export const exerciseDbApi = {
  search: (query: string, limit = 25) =>
    apiRequest(`/exercises/search/?q=${encodeURIComponent(query)}&limit=${limit}`),
  get: (id: string) => apiRequest(`/exercises/${id}/`),
};

// Types (matching your existing types)
export interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  profile?: Profile;
  roles?: { role: "admin" | "user" }[];
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: "g" | "ml";
  category: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ConsumptionLog {
  id: string;
  product_id: string;
  products?: Product;
  amount: number;
  consumed_at: string;
  created_at: string;
}

export interface Settings {
  id: string;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  day_of_week: number | null;
  category_id: string | null;
  category?: ExerciseCategory;
  exercises?: WorkoutDayExercise[];
  created_at: string;
}

export interface WorkoutDayExercise {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  name: string;
  gif_url: string | null;
  video_url: string | null;
  body_part: string | null;
  target: string | null;
  equipment: string | null;
  position: number;
  created_at: string;
}

export interface WorkoutCompletion {
  id: string;
  workout_day_id: string;
  workout_day?: WorkoutDay;
  completed_at: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  weight_kg: number;
  logged_at: string;
  note: string | null;
  created_at: string;
}

export interface ExerciseDBItem {
  exerciseId: string;
  name: string;
  gifUrl: string;
  videoUrl?: string;
  bodyParts: string[];
  targetMuscles: string[];
  equipments: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}
