#include "bmp.h"

#include <algorithm>
#include <iostream>
#include <string>

struct ROI {
  int x1, y1, x2, y2;
};

ROI detectToothROI(const BMPImage &img) {
  int w = img.width();
  int h = img.height();

  // 只搜尋影像中央
  int sx1 = w * 0.10;
  int sx2 = w * 0.90;
  int sy1 = h * 0.15;
  int sy2 = h * 0.85;

  int minX = sx2;
  int minY = sy2;
  int maxX = sx1;
  int maxY = sy1;

  // X-ray 中牙齒通常是較亮的區域
  const int threshold = 150;
  for (int y = sy1; y < sy2; ++y) {
    for (int x = sx1; x < sx2; ++x) {
      const Pixel &p = img.pixels[static_cast<size_t>(y) * w + x];

      int gray = (299 * p.r + 587 * p.g + 114 * p.b) / 1000;
      if (gray >= threshold) {
        minX = std::min(minX, x);
        maxX = std::max(maxX, x);
        minY = std::min(minY, y);
        maxY = std::max(maxY, y);
      }
    }
  }

  int mx = w * 0.02;
  int my = h * 0.04;
  minX   = std::max(0, minX - mx);
  minY   = std::max(0, minY - my);
  maxX   = std::min(w - 1, maxX + mx);
  maxY   = std::min(h - 1, maxY + my);

  return {minX, minY, maxX, maxY};
}

int main(int argc, char **argv) {
  std::string input  = argc > 1 ? argv[1] : "A1.bmp";
  std::string output = argc > 2 ? argv[2] : "tooth_roi.bmp";

  BMPImage image;
  if (!image.load(input)) {
    return 1;
  }

  ROI roi = detectToothROI(image);

  std::cout << "ROI: " << roi.x1 << ", " << roi.y1 << " -> " << roi.x2 << ", " << roi.y2 << '\n';

  Pixel red {0, 0, 255};
  image.drawRect(roi.x1, roi.y1, roi.x2, roi.y2, red, 3);
  image.save(output);

  return 0;
}
