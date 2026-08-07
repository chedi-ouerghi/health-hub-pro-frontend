import { describe, it, expect, vi, afterEach } from "vitest";
import { isToday } from "./doctor-dashboard";

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

describe("isToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for the current instant", () => {
    expect(isToday(new Date())).toBe(true);
  });

  it("returns false for yesterday and tomorrow", () => {
    expect(isToday(daysFromNow(-1))).toBe(false);
    expect(isToday(daysFromNow(1))).toBe(false);
  });

  it("ignores the time of day when comparing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 6, 12, 0, 0));
    expect(isToday(new Date(2026, 7, 6, 1, 0, 0))).toBe(true);
    expect(isToday(new Date(2026, 7, 5, 23, 0, 0))).toBe(false);
    expect(isToday(new Date(2026, 7, 7, 0, 0, 0))).toBe(false);
  });
});
