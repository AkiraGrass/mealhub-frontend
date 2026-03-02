import { describe, expect, it } from 'vitest';

const toRestaurantId = (value: string): number => Number(value);

describe('restaurant detail helpers', () => {
  it('parses route param to number', () => {
    expect(toRestaurantId('12')).toBe(12);
  });
});

