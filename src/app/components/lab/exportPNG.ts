export function exportPNG(
  render: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  size: number,
  transparent: boolean
) {
  const c = document.createElement("canvas");
  const dpr = 2;
  c.width = Math.floor(size * dpr);
  c.height = Math.floor(size * dpr);
  const gg = c.getContext("2d");
  if (!gg) return;

  if (transparent) gg.clearRect(0, 0, c.width, c.height);
  render(gg, c.width, c.height);

  const url = c.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = "astronaut-logo.png";
  a.click();
}
