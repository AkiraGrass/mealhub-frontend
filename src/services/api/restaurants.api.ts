import type { ApiEnvelope, PaginationMeta } from '@/types/api';
import type { RestaurantDetail, RestaurantSummary } from '@/types/restaurant';
import { httpClient } from '@/services/http/client';

export interface RestaurantsListResult {
  items: RestaurantSummary[];
  meta: PaginationMeta;
}

export const fetchRestaurantsApi = async (page = 1, perPage = 10): Promise<RestaurantsListResult> => {
  const response = await httpClient.get<ApiEnvelope<RestaurantSummary[]>>('/restaurants', {
    params: { page, perPage }
  });

  return {
    items: (response.data.data ?? []) as RestaurantSummary[],
    meta: response.data.meta as PaginationMeta
  };
};

export const fetchRestaurantDetailApi = async (restaurantId: number): Promise<RestaurantDetail> => {
  const response = await httpClient.get<ApiEnvelope<RestaurantDetail>>(`/restaurants/${restaurantId}`);
  return response.data.data as RestaurantDetail;
};

