import { expect, test } from '@playwright/test';

test('local browser-image-compression vendor script compresses a large image', async ({ page }) => {
  await page.goto('/metal-coating');
  await page.addScriptTag({ url: '/vendor/browser-image-compression.js' });

  const result = await page.evaluate(async () => {
    const size = 1400;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');
    const pixels = context.createImageData(size, size);
    for (let i = 0; i < pixels.data.length; i += 4) {
      pixels.data[i] = Math.random() * 255;
      pixels.data[i + 1] = Math.random() * 255;
      pixels.data[i + 2] = Math.random() * 255;
      pixels.data[i + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Failed to create source PNG');
    const source = new File([blob], 'compression-test.png', { type: 'image/png' });

    const compressor = (window as unknown as {
      imageCompression: (
        file: File,
        options: Record<string, unknown>
      ) => Promise<File>;
    }).imageCompression;

    const output = await compressor(source, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 900,
      useWebWorker: true,
      libURL: '/vendor/browser-image-compression.js',
      initialQuality: 0.8,
      fileType: 'image/webp',
      maxIteration: 12,
    });
    const bitmap = await createImageBitmap(output);

    return {
      sourceSize: source.size,
      outputSize: output.size,
      outputType: output.type,
      width: bitmap.width,
      height: bitmap.height,
    };
  });

  expect(result.outputSize).toBeLessThan(result.sourceSize);
  expect(result.outputSize).toBeLessThanOrEqual(5 * 1024 * 1024);
  expect(result.width).toBeLessThanOrEqual(900);
  expect(result.height).toBeLessThanOrEqual(900);
  expect(result.outputType).toBe('image/webp');
});
