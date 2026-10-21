import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
// The published bundle, which the package exports.
import svgPanZoom from "../dist/svg-pan-zoom.js";
import { mountFixture } from "./fixture.js";

const svgSelector = "#test-inline";
let instance;

function initSvgPanZoom(options) {
  return svgPanZoom(svgSelector, options);
}

beforeEach(() => {
  mountFixture();
});

afterEach(() => {
  instance?.destroy();
  instance = null;
});

describe("pan state", () => {
  test("by default pan should be enabled", () => {
    instance = initSvgPanZoom();

    expect(instance.isPanEnabled()).toBe(true);
  });

  test("disable pan via options", () => {
    instance = initSvgPanZoom({ panEnabled: false });

    expect(instance.isPanEnabled()).toBe(false);
  });

  test("disable and enable pan via API", () => {
    instance = initSvgPanZoom();

    instance.disablePan();
    expect(instance.isPanEnabled()).toBe(false);

    instance.enablePan();
    expect(instance.isPanEnabled()).toBe(true);
  });
});

describe("zoom state", () => {
  test("by default zoom should be enabled", () => {
    instance = initSvgPanZoom();

    expect(instance.isZoomEnabled()).toBe(true);
  });

  test("disable zoom via options", () => {
    instance = initSvgPanZoom({ zoomEnabled: false });

    expect(instance.isZoomEnabled()).toBe(false);
  });

  test("disable and enable zoom via API", () => {
    instance = initSvgPanZoom();

    instance.disableZoom();
    expect(instance.isZoomEnabled()).toBe(false);

    instance.enableZoom();
    expect(instance.isZoomEnabled()).toBe(true);
  });
});

describe("controls state", () => {
  test("by default controls are disabled", () => {
    instance = initSvgPanZoom();

    expect(instance.isControlIconsEnabled()).toBe(false);
  });

  test("enable controls via options", () => {
    instance = initSvgPanZoom({ controlIconsEnabled: true });

    expect(instance.isControlIconsEnabled()).toBe(true);
  });

  test("disable and enable controls via API", () => {
    instance = initSvgPanZoom();

    instance.enableControlIcons();
    expect(instance.isControlIconsEnabled()).toBe(true);

    instance.disableControlIcons();
    expect(instance.isControlIconsEnabled()).toBe(false);
  });
});

describe("double click zoom state", () => {
  test("by default double click zoom is enabled", () => {
    instance = initSvgPanZoom();

    expect(instance.isDblClickZoomEnabled()).toBe(true);
  });

  test("disable double click zoom via options", () => {
    instance = initSvgPanZoom({ dblClickZoomEnabled: false });

    expect(instance.isDblClickZoomEnabled()).toBe(false);
  });

  test("disable and enable double click zoom via API", () => {
    instance = initSvgPanZoom();

    instance.disableDblClickZoom();
    expect(instance.isDblClickZoomEnabled()).toBe(false);

    instance.enableDblClickZoom();
    expect(instance.isDblClickZoomEnabled()).toBe(true);
  });
});

describe("mouse wheel zoom state", () => {
  test("by default mouse wheel zoom is enabled", () => {
    instance = initSvgPanZoom();

    expect(instance.isMouseWheelZoomEnabled()).toBe(true);
  });

  test("disable mouse wheel zoom via options", () => {
    instance = initSvgPanZoom({ mouseWheelZoomEnabled: false });

    expect(instance.isMouseWheelZoomEnabled()).toBe(false);
  });

  test("disable and enable mouse wheel zoom via API", () => {
    instance = initSvgPanZoom();

    instance.disableMouseWheelZoom();
    expect(instance.isMouseWheelZoomEnabled()).toBe(false);

    instance.enableMouseWheelZoom();
    expect(instance.isMouseWheelZoomEnabled()).toBe(true);
  });
});

describe("pan", () => {
  test("pan", () => {
    instance = initSvgPanZoom();

    instance.pan({ x: 100, y: 300 });

    expect(instance.getPan()).toEqual({ x: 100, y: 300 });
  });

  test("pan through API should work even if pan is disabled", () => {
    instance = initSvgPanZoom({ panEnabled: false });

    instance.pan({ x: 100, y: 300 });

    expect(instance.getPan()).toEqual({ x: 100, y: 300 });
  });

  test("pan by", () => {
    instance = initSvgPanZoom();
    const initialPan = instance.getPan();

    instance.panBy({ x: 100, y: 300 });

    expect(instance.getPan()).toEqual({
      x: initialPan.x + 100,
      y: initialPan.y + 300,
    });
  });
});

describe("pan callbacks", () => {
  test("before pan", () => {
    instance = initSvgPanZoom();
    const initialPan = instance.getPan();
    const beforePan = vi.fn();
    instance.setBeforePan(beforePan);

    instance.pan({ x: 100, y: 300 });
    instance.setBeforePan(null);
    instance.pan({ x: 50, y: 150 });

    expect(beforePan).toHaveBeenCalledOnce();
    expect(beforePan.mock.calls[0][0]).toEqual(initialPan);
  });

  test("don't trigger on pan if cancelled by before pan", () => {
    const onPan = vi.fn();
    instance = initSvgPanZoom({ onPan });

    instance.panBy({ x: 100, y: 300 });
    instance.setBeforePan(() => false);
    instance.panBy({ x: 100, y: 300 });

    expect(onPan).toHaveBeenCalledOnce();
  });

  test("don't trigger on pan if cancelled by before pan for each axis separately", () => {
    const onPan = vi.fn();
    instance = initSvgPanZoom({ onPan });

    instance.panBy({ x: 100, y: 300 });
    instance.setBeforePan(() => ({ x: false, y: false }));
    instance.panBy({ x: 100, y: 300 });

    expect(onPan).toHaveBeenCalledOnce();
  });

  test("on pan", () => {
    instance = initSvgPanZoom();
    const onPan = vi.fn();
    instance.setOnPan(onPan);

    instance.pan({ x: 100, y: 300 });
    instance.setOnPan(null);
    instance.pan({ x: 50, y: 150 });

    expect(onPan).toHaveBeenCalledOnce();
    expect(onPan).toHaveBeenCalledWith({ x: 100, y: 300 });
  });

  test("change only X axis when Y axis change is prevented with before pan", () => {
    instance = initSvgPanZoom();
    const initialPan = instance.getPan();
    const onPan = vi.fn();
    instance.setOnPan(onPan);
    instance.setBeforePan(() => ({ y: false }));

    instance.panBy({ x: 100, y: 300 });

    expect(onPan).toHaveBeenCalledOnce();
    const [newPan] = onPan.mock.calls[0];
    expect(newPan.x).not.toBe(initialPan.x);
    expect(newPan.y).toBe(initialPan.y);
  });

  test("change pan values from before pan", () => {
    instance = initSvgPanZoom();
    const onPan = vi.fn();
    instance.setOnPan(onPan);
    instance.setBeforePan(() => ({ x: 1, y: 2 }));

    instance.panBy({ x: 100, y: 300 });

    expect(onPan).toHaveBeenCalledOnce();
    expect(onPan).toHaveBeenCalledWith({ x: 1, y: 2 });
  });

  test("don't pan if before pan makes the pan unnecessary", () => {
    instance = initSvgPanZoom();
    const initialPan = instance.getPan();
    const onPan = vi.fn();
    instance.setOnPan(onPan);
    instance.setBeforePan(() => ({ x: false, y: initialPan.y }));

    instance.panBy({ x: 100, y: 300 });

    expect(onPan).not.toHaveBeenCalled();
  });
});

describe("zoom", () => {
  test("zoom", () => {
    instance = initSvgPanZoom();

    instance.zoom(3);

    expect(instance.getZoom()).toBe(3);
  });

  test("zoom by", () => {
    instance = initSvgPanZoom();
    const initialZoom = instance.getZoom();

    instance.zoomBy(2);

    expect(instance.getZoom()).toBe(initialZoom * 2);
  });

  test("zoom at point", () => {
    instance = initSvgPanZoom({ fit: false });

    instance.zoomAtPoint(2, { x: 200, y: 100 });

    expect(instance.getZoom()).toBeCloseTo(2, 4);
    expect(instance.getPan()).toEqual({ x: -300, y: -600 });
  });

  test("zoom at point by", () => {
    instance = initSvgPanZoom({ fit: false });

    instance.zoomAtPointBy(2, { x: 200, y: 100 });

    expect(instance.getZoom()).toBeCloseTo(2, 4);
    expect(instance.getPan()).toEqual({ x: -300, y: -600 });
  });

  test("zoom at point by (with SVG point)", () => {
    instance = initSvgPanZoom({ fit: false });
    const svgPoint = document.querySelector(svgSelector).createSVGPoint();
    svgPoint.x = 200;
    svgPoint.y = 100;

    instance.zoomAtPointBy(2, svgPoint);

    expect(instance.getZoom()).toBeCloseTo(2, 4);
    expect(instance.getPan()).toEqual({ x: -300, y: -600 });
  });

  test("zoom in", () => {
    instance = initSvgPanZoom({ fit: false });

    instance.zoomIn();

    expect(instance.getZoom()).toBeCloseTo(1.1, 4);
    expect(instance.getPan().x).toBeCloseTo(-90, 4);
    expect(instance.getPan().y).toBeCloseTo(-290, 4);
  });

  test("zoom out", () => {
    instance = initSvgPanZoom({ fit: false });

    instance.zoomOut();

    expect(instance.getZoom()).toBeCloseTo(0.90909, 4);
    expect(instance.getPan().x).toBeCloseTo(-13.636374, 4);
    expect(instance.getPan().y).toBeCloseTo(-213.636374, 4);
  });
});

// fit: false keeps the initial zoom at 1.
describe("zoom settings", () => {
  test("default min zoom", () => {
    instance = initSvgPanZoom({ fit: false });

    instance.zoom(0.1);

    expect(instance.getZoom()).toBe(0.5);
  });

  test("min zoom", () => {
    instance = initSvgPanZoom({ fit: false, minZoom: 1 });

    instance.zoom(0.01);

    expect(instance.getZoom()).toBe(1);
  });

  test("default max zoom", () => {
    instance = initSvgPanZoom({ fit: false });

    instance.zoom(50);

    expect(instance.getZoom()).toBe(10);
  });

  test("max zoom", () => {
    instance = initSvgPanZoom({ fit: false, maxZoom: 20 });

    instance.zoom(50);

    expect(instance.getZoom()).toBe(20);
  });

  test("zoomScaleSensitivity is used by zoomIn and zoomOut", () => {
    const sensitivity = 0.2;
    instance = initSvgPanZoom({
      fit: false,
      zoomScaleSensitivity: sensitivity,
    });
    const initialZoom = instance.getZoom();

    instance.zoomIn();
    expect(instance.getZoom()).toBeCloseTo(initialZoom * (1 + sensitivity), 4);

    instance.zoom(2);
    instance.zoomOut();
    expect(instance.getZoom()).toBeCloseTo(2 / (1 + sensitivity), 4);
  });
});

describe("zoom callbacks", () => {
  test("before zoom", () => {
    instance = initSvgPanZoom();
    const initialZoom = instance.getZoom();
    const beforeZoom = vi.fn();
    instance.setBeforeZoom(beforeZoom);

    instance.zoom(2.3);
    instance.setBeforeZoom(null);
    instance.zoom(2.4);

    expect(beforeZoom).toHaveBeenCalledOnce();
    expect(beforeZoom.mock.calls[0][0]).toBeCloseTo(initialZoom, 4);
  });

  test("on zoom", () => {
    instance = initSvgPanZoom();
    const onZoom = vi.fn();
    instance.setOnZoom(onZoom);

    instance.zoom(2.3);
    instance.setOnZoom(null);
    instance.zoom(2.4);

    expect(onZoom).toHaveBeenCalledOnce();
    expect(onZoom.mock.calls[0][0]).toBeCloseTo(2.3, 4);
  });
});

describe("reset", () => {
  test("reset zoom", () => {
    instance = initSvgPanZoom();
    const initialZoom = instance.getZoom();

    instance.zoom(2.3);
    instance.resetZoom();

    expect(instance.getZoom()).toBeCloseTo(initialZoom, 4);
  });

  test("reset pan", () => {
    instance = initSvgPanZoom();
    const initialPan = instance.getPan();

    instance.panBy({ x: 100, y: 300 });
    instance.resetPan();

    expect(instance.getPan()).toEqual(initialPan);
  });

  test("reset (zoom and pan)", () => {
    instance = initSvgPanZoom();
    const initialZoom = instance.getZoom();
    const initialPan = instance.getPan();

    instance.zoom(2.3);
    instance.panBy({ x: 100, y: 300 });
    instance.reset();

    expect(instance.getZoom()).toBeCloseTo(initialZoom, 4);
    expect(instance.getPan()).toEqual(initialPan);
  });
});

describe("fit and center", () => {
  // Without a viewBox, the initial zoom is always 1.
  test("fit when initialized with fit: true", () => {
    instance = initSvgPanZoom();

    instance.fit();

    expect(instance.getZoom()).toBeCloseTo(1, 4);
  });

  // zoom = Math.min(700 / 800, 300 / 800) = 0.375
  test("fit when initialized with fit: false", () => {
    instance = initSvgPanZoom({ fit: false, minZoom: 0.1 });

    instance.fit();

    expect(instance.getZoom()).toBeCloseTo(0.375, 4);
  });

  // At zoom 1 the viewport is 300x300: x = (700 - 300) / 2, y = (300 - 300) / 2
  test("center when zoom is 1", () => {
    instance = initSvgPanZoom();

    instance.center();

    expect(instance.getPan()).toEqual({ x: 200, y: 0 });
  });

  // At zoom 0.5 the viewport is 150x150: x = (700 - 150) / 2, y = (300 - 150) / 2
  test("center when zoom is 0.5", () => {
    instance = initSvgPanZoom();

    instance.zoom(0.5);
    instance.center();

    expect(instance.getPan()).toEqual({ x: 275, y: 75 });
  });
});

describe("on updated CTM", () => {
  test("onUpdatedCTM is called", async () => {
    instance = initSvgPanZoom();
    const onUpdatedCTM = vi.fn();
    instance.setOnUpdatedCTM(onUpdatedCTM);

    instance.panBy({ x: 100, y: 300 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Called on the frame that initialization requested and on the one panBy requested.
    expect(onUpdatedCTM).toHaveBeenCalledTimes(2);
  });
});

describe("destroy", () => {
  test("after destroy calling svgPanZoom again should return a new instance", () => {
    const destroyed = initSvgPanZoom();
    destroyed.destroy();

    instance = initSvgPanZoom();

    expect(instance).not.toBe(destroyed);
  });
});
