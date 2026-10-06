import { describe, it, expect } from 'vitest';
import { MoodboardData, MoodboardItem } from '../../types/ipc';

describe('Moodboard Canvas Performance Benchmark', () => {
  function generateBenchmarkBoard(itemCount: number): MoodboardData {
    const items: MoodboardItem[] = [];

    for (let i = 1; i <= itemCount; i++) {
      const mod = i % 4;
      const x = (i % 10) * 150;
      const y = Math.floor(i / 10) * 150;

      if (mod === 0) {
        items.push({
          type: 'text',
          id: `txt-${i}`,
          x,
          y,
          width: 140,
          height: 60,
          text: `Inspiration Note #${i}`,
          style: 'body',
          z_index: i,
        });
      } else if (mod === 1) {
        items.push({
          type: 'color',
          id: `col-${i}`,
          x,
          y,
          width: 80,
          height: 80,
          hex: '#5F7184',
          label: `Palette ${i}`,
          z_index: i,
        });
      } else if (mod === 2) {
        items.push({
          type: 'image',
          id: `img-${i}`,
          x,
          y,
          width: 200,
          height: 150,
          asset_path: `Assets/Images/photo_${i}.jpg`,
          caption: `Photo ${i}`,
          z_index: i,
        });
      } else {
        items.push({
          type: 'link',
          id: `link-${i}`,
          x,
          y,
          width: 160,
          height: 60,
          title: `Document ${i}`,
          target_path: `Desk/Characters/Char_${i}.md`,
          z_index: i,
        });
      }
    }

    return {
      id: 'mb-benchmark',
      name: 'Large Benchmark Board',
      canvas: { pan_x: 0, pan_y: 0, zoom: 1.0 },
      items,
      updated_at: Date.now(),
    };
  }

  function transformBoardItems(board: MoodboardData, dx: number, dy: number): MoodboardData {
    const updated = board.items.map((item) => ({
      ...item,
      x: item.x + dx,
      y: item.y + dy,
    }));
    return { ...board, items: updated };
  }

  it('transforms and moves 100 moodboard canvas items in < 20ms', () => {
    const board = generateBenchmarkBoard(100);
    expect(board.items.length).toBe(100);

    // Warm-up
    for (let i = 0; i < 5; i++) {
      transformBoardItems(board, 10, 10);
    }

    const start = performance.now();
    const updated = transformBoardItems(board, 25, 40);
    const duration = performance.now() - start;

    expect(updated.items[0].x).toBe(board.items[0].x + 25);
    expect(updated.items[0].y).toBe(board.items[0].y + 40);
    expect(duration).toBeLessThan(20);
  });
});
