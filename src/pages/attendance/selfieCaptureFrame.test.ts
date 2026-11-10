import { describe, expect, it, vi } from "vitest";
import { drawUnmirroredSelfieFrame } from "./selfieCaptureFrame";

describe("drawUnmirroredSelfieFrame", () => {
  it("draws the video flipped horizontally onto a canvas", () => {
    const translate = vi.fn();
    const scale = vi.fn();
    const drawImage = vi.fn();
    const getContext = vi.fn(() => ({ translate, scale, drawImage }));

    vi.spyOn(document, "createElement").mockImplementation(() => {
      return {
        width: 0,
        height: 0,
        getContext,
      } as unknown as HTMLCanvasElement;
    });

    const video = {
      videoWidth: 320,
      videoHeight: 240,
    } as HTMLVideoElement;

    const canvas = drawUnmirroredSelfieFrame(video);
    expect(canvas).not.toBeNull();
    expect(translate).toHaveBeenCalledWith(320, 0);
    expect(scale).toHaveBeenCalledWith(-1, 1);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 320, 240);

    vi.restoreAllMocks();
  });
});
