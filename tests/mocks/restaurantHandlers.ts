import { http, HttpResponse } from 'msw';
import type { RestaurantDetail, RestaurantSummary } from '@/types/restaurant';

const buildSummary = (overrides: Partial<RestaurantSummary> = {}): RestaurantSummary => ({
  id: overrides.id ?? 1,
  name: overrides.name ?? 'Mock Restaurant',
  description: overrides.description ?? '說明',
  address: overrides.address ?? '台北市中正區復興南路一段',
  status: overrides.status ?? 'ACTIVE',
  cuisineType: overrides.cuisineType ?? 'fine-dining'
});

const defaultSummaries: RestaurantSummary[] = [
  buildSummary({ id: 1, name: 'Golden Table', cuisineType: 'fine-dining' }),
  buildSummary({ id: 2, name: 'Ember Grill', cuisineType: 'bbq-house' }),
  buildSummary({ id: 3, name: 'Urban Bistro', cuisineType: 'modern-bistro' })
];

const defaultDetail: RestaurantDetail = {
  ...buildSummary({ id: 1, name: 'Golden Table', cuisineType: 'fine-dining' }),
  note: '提供季節套餐',
  timeslots: [
    { start: '11:30', end: '14:30' },
    { start: '17:30', end: '21:30' }
  ],
  tableBuckets: { small: 10, medium: 5, large: 2 }
};

export const restaurantHandlers = [
  http.get('*/restaurants', () =>
    HttpResponse.json({
      data: defaultSummaries,
      meta: { total: defaultSummaries.length, lastPage: 1 }
    })
  ),
  http.get('*/restaurants/:id', ({ params }) => {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return HttpResponse.json({ message: 'invalid' }, { status: 400 });
    }
    return HttpResponse.json({ data: { ...defaultDetail, id } });
  }),
  http.get('*/restaurants-timeout', async () => {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 12_000));
    return HttpResponse.json({ message: 'timeout' }, { status: 504 });
  }),
  http.get('*/restaurants-permission', () =>
    HttpResponse.json({ message: 'unauthorized' }, { status: 401 })
  )
];

export const createRestaurantsFixtures = () => ({ summaries: defaultSummaries, detail: defaultDetail });
