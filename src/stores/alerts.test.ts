import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ALERT_DISMISS_MS, useAlertStore } from "./alerts";

describe("useAlertStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-dismisses alerts after 5 seconds", () => {
    const alerts = useAlertStore();
    alerts.add("Connected", "success");

    expect(alerts.alerts).toHaveLength(1);

    vi.advanceTimersByTime(ALERT_DISMISS_MS);
    expect(alerts.alerts).toHaveLength(0);
  });

  it("clears timer when dismissed manually", () => {
    const alerts = useAlertStore();
    alerts.add("Error", "error");
    const id = alerts.alerts[0].id;

    alerts.remove(id);
    expect(alerts.alerts).toHaveLength(0);

    vi.advanceTimersByTime(ALERT_DISMISS_MS);
    expect(alerts.alerts).toHaveLength(0);
  });
});
