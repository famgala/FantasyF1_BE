import api from "./api";

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  number: number;
  team?: string;
  country?: string;
  status: "active" | "reserve" | "retired";
  total_points?: number;
  average_points?: number;
  price?: number;
  championships?: number;
  wins?: number;
  podiums?: number;
}

export interface DriverStats {
  driver_id: number;
  season: number;
  total_points: number;
  average_points: number;
  best_finish: number;
  races_completed: number;
  podiums: number;
  wins: number;
  dnfs: number;
}

export const driverService = {
  async getAllDrivers(): Promise<Driver[]> {
    const response = await api.get<Driver[]>("/drivers");
    return response.data;
  },

  async getDriverById(id: number): Promise<Driver> {
    const response = await api.get<Driver>(`/drivers/${id}`);
    return response.data;
  },

  async getActiveDrivers(): Promise<Driver[]> {
    const response = await api.get<Driver[]>("/drivers?status=active");
    return response.data;
  },

  async getDriverStats(driverId: number, season?: number): Promise<DriverStats> {
    const seasonParam = season ? `?season=${season}` : "";
    const response = await api.get<DriverStats>(
      `/drivers/${driverId}/stats${seasonParam}`
    );
    return response.data;
  },

  async searchDrivers(query: string): Promise<Driver[]> {
    const response = await api.get<Driver[]>(`/drivers/search?q=${query}`);
    return response.data;
  },
};

export default driverService;
