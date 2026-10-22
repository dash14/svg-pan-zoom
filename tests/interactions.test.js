import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { cdp, userEvent } from "vitest/browser";
// The published bundle, which the package exports.
import svgPanZoom from "../dist/svg-pan-zoom.js";
import { mountFixture } from "./fixture.js";

let svg, instance;

beforeEach(() => {
  svg = mountFixture();
});

afterEach(() => {
  instance?.destroy();
  instance = null;
});

// The point of the drawing shown at (x, y) of the SVG element.
function drawingPointAt(x, y) {
  const { x: panX, y: panY } = instance.getPan();
  const { realZoom } = instance.getSizes();
  return { x: (x - panX) / realZoom, y: (y - panY) / realZoom };
}

function expectPointCloseTo(actual, expected) {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
}

const drag = {
  sourcePosition: { x: 100, y: 100 },
  targetPosition: { x: 150, y: 130 },
};

// Playwright's touchscreen only taps, so fingers go through the DevTools protocol, which takes
// coordinates in the top-level page. Each point is [x, y] on the SVG element, and its index is the
// finger. Lifting a finger is sent as the fingers that stay; with none, all of them lift.
async function touch(type, points) {
  const frame = window.frameElement?.getBoundingClientRect() ?? {
    left: 0,
    top: 0,
    width: window.innerWidth,
  };
  const scale = frame.width / window.innerWidth;
  const rect = svg.getBoundingClientRect();
  await cdp().send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map(([x, y], id) => ({
      id,
      x: frame.left + (rect.left + x) * scale,
      y: frame.top + (rect.top + y) * scale,
    })),
  });
}

// One finger lands first, as with a real hand, so the library is panning when the second lands.
async function pinch(from, to) {
  await touch("touchStart", [from[0]]);
  await touch("touchStart", from);
  await touch("touchMove", to);
  await touch("touchEnd", []);
}

async function tap(point) {
  await touch("touchStart", [point]);
  await touch("touchEnd", []);
}

describe("mouse", () => {
  test("dragging pans by the distance moved", async () => {
    instance = svgPanZoom(svg);
    const initialPan = instance.getPan();

    await userEvent.dragAndDrop(svg, svg, drag);

    expectPointCloseTo(instance.getPan(), {
      x: initialPan.x + 50,
      y: initialPan.y + 30,
    });
  });

  test("dragging does not pan when pan is disabled", async () => {
    instance = svgPanZoom(svg, { panEnabled: false });
    const initialPan = instance.getPan();

    await userEvent.dragAndDrop(svg, svg, drag);

    expect(instance.getPan()).toEqual(initialPan);
  });

  // userEvent.wheel points at the center of the element.
  test("wheeling up zooms in around the pointer", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(350, 150);

    await userEvent.wheel(svg, { delta: { y: -100 } });

    expect(instance.getZoom()).toBeGreaterThan(initialZoom);
    expectPointCloseTo(drawingPointAt(350, 150), pointed);
  });

  test("wheeling down zooms out around the pointer", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(350, 150);

    await userEvent.wheel(svg, { delta: { y: 100 } });

    expect(instance.getZoom()).toBeLessThan(initialZoom);
    expectPointCloseTo(drawingPointAt(350, 150), pointed);
  });

  test("wheeling does not zoom when mouse wheel zoom is disabled", async () => {
    instance = svgPanZoom(svg, { mouseWheelZoomEnabled: false });
    const initialZoom = instance.getZoom();

    await userEvent.wheel(svg, { delta: { y: -100 } });

    expect(instance.getZoom()).toBe(initialZoom);
  });

  test("wheeling does not zoom after mouse wheel zoom is turned off", async () => {
    instance = svgPanZoom(svg);
    instance.disableMouseWheelZoom();
    const initialZoom = instance.getZoom();

    await userEvent.wheel(svg, { delta: { y: -100 } });

    expect(instance.getZoom()).toBe(initialZoom);
  });

  test("wheeling does not zoom when zoom is disabled", async () => {
    instance = svgPanZoom(svg, { zoomEnabled: false });
    const initialZoom = instance.getZoom();

    await userEvent.wheel(svg, { delta: { y: -100 } });

    expect(instance.getZoom()).toBe(initialZoom);
  });

  // The factor is (1 + zoomScaleSensitivity) * 2.
  test("double clicking zooms in by 2.2 around the pointer", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(200, 100);

    await userEvent.dblClick(svg, { position: { x: 200, y: 100 } });

    expect(instance.getZoom()).toBeCloseTo(initialZoom * 2.2, 4);
    expectPointCloseTo(drawingPointAt(200, 100), pointed);
  });

  test("double clicking with Shift zooms out by 2.2 around the pointer", async () => {
    // 1 / 2.2 is below the default minZoom of 0.5.
    instance = svgPanZoom(svg, { minZoom: 0.1 });
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(200, 100);

    await userEvent.dblClick(svg, {
      position: { x: 200, y: 100 },
      modifiers: ["Shift"],
    });

    expect(instance.getZoom()).toBeCloseTo(initialZoom / 2.2, 4);
    expectPointCloseTo(drawingPointAt(200, 100), pointed);
  });

  test("double clicking does not zoom when double click zoom is disabled", async () => {
    instance = svgPanZoom(svg, { dblClickZoomEnabled: false });
    const initialZoom = instance.getZoom();

    await userEvent.dblClick(svg, { position: { x: 200, y: 100 } });

    expect(instance.getZoom()).toBe(initialZoom);
  });
});

describe("touch", () => {
  test("dragging one finger pans by the distance moved", async () => {
    instance = svgPanZoom(svg);
    const initialPan = instance.getPan();

    await touch("touchStart", [[100, 100]]);
    await touch("touchMove", [[150, 130]]);
    await touch("touchEnd", []);

    expectPointCloseTo(instance.getPan(), {
      x: initialPan.x + 50,
      y: initialPan.y + 30,
    });
  });

  test("dragging one finger does not pan when pan is disabled", async () => {
    instance = svgPanZoom(svg, { panEnabled: false });
    const initialPan = instance.getPan();

    await touch("touchStart", [[100, 100]]);
    await touch("touchMove", [[150, 130]]);
    await touch("touchEnd", []);

    expect(instance.getPan()).toEqual(initialPan);
  });

  test("pinching out zooms in by the ratio of the finger distances around their midpoint", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(350, 150);

    await pinch(
      [
        [300, 150],
        [400, 150],
      ],
      [
        [250, 150],
        [450, 150],
      ]
    );

    expect(instance.getZoom()).toBeCloseTo(initialZoom * 2, 4);
    expectPointCloseTo(drawingPointAt(350, 150), pointed);
  });

  test("pinching while moving keeps the drawing under the midpoint of the fingers", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(350, 150);

    await pinch(
      [
        [300, 150],
        [400, 150],
      ],
      [
        [250, 100],
        [450, 100],
      ]
    );

    expect(instance.getZoom()).toBeCloseTo(initialZoom * 2, 4);
    expectPointCloseTo(drawingPointAt(350, 100), pointed);
  });

  test("pinching does not zoom when zoom is disabled", async () => {
    instance = svgPanZoom(svg, { zoomEnabled: false });
    const initialZoom = instance.getZoom();

    await pinch(
      [
        [300, 150],
        [400, 150],
      ],
      [
        [250, 150],
        [450, 150],
      ]
    );

    expect(instance.getZoom()).toBe(initialZoom);
  });

  test("double tapping zooms in by 2.2 around the finger", async () => {
    instance = svgPanZoom(svg);
    const initialZoom = instance.getZoom();
    const pointed = drawingPointAt(200, 100);

    await tap([200, 100]);
    await tap([200, 100]);

    expect(instance.getZoom()).toBeCloseTo(initialZoom * 2.2, 4);
    expectPointCloseTo(drawingPointAt(200, 100), pointed);
  });

  test("double tapping does not zoom when double click zoom is disabled", async () => {
    instance = svgPanZoom(svg, { dblClickZoomEnabled: false });
    const initialZoom = instance.getZoom();

    await tap([200, 100]);
    await tap([200, 100]);

    expect(instance.getZoom()).toBe(initialZoom);
  });
});
