#include <iostream>
#include <vector>

#include "bmp.h"

const Pixel red {0, 0, 255};

const int OK_THREAD_MIN    = 110;  // min
const int OK_THREAD_MAX    = 255;  // max
const int ERROR_THREAD_MIN = 0;    // min
const int ERROR_THREAD_MAX = 80;   // max

struct Region {
  int x1, y1;
  int x2, y2;
};

int getRangeGray(const BMPImage &img, int x, int y, int dx, int dy);

int main() {
  Region regions[] = {
      // up
      {330, 160, 400, 180},  // ok
      {340, 180, 410, 210},  // ok
      {410, 180, 620, 220},  // ok
      {450, 220, 580, 230},  // ok
      {620, 180, 690, 205},  // ok
      // down
      {320, 220, 400, 250},
      {400, 240, 450, 270},
      {450, 250, 550, 280},
      {550, 240, 630, 270},
      {630, 220, 680, 260},
      {680, 220, 770, 260},
      {700, 200, 765, 225},
      // {320, 220, 760, 300},
  };

  BMPImage img;
  if (!img.load("input.bmp")) {
    std::cout << "Load Error" << std::endl;
    return 1;
  }

  int w = img.width();
  int h = img.height();

  std::cout << w << ";" << h << std::endl;

  BMPImage out_img = img.crop(0, 0, w, h);
  BMPImage tmp_img = img.crop(0, 0, w, h);
  tmp_img.thresholdBelow(120);

  for (int x = 0; x < w; x++) {
    for (int y = 0; y < h; y++) {
      Region *inRegion = nullptr;
      for (Region region : regions) {
        if (x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2) {
          inRegion = &region;
          break;
        }
      }

      if (inRegion) {
        // out_img.setPixel(x, y, red);
        Pixel pixel = tmp_img[x][y];
        int   gray  = pixel.gray();
        if (gray > OK_THREAD_MIN && gray < OK_THREAD_MAX) {
          continue;
        }

        int up_range_gray    = getRangeGray(tmp_img, x, y - 2, 0, -2);
        int down_range_gray  = getRangeGray(tmp_img, x, y + 2, 0, 2);
        int left_range_gray  = getRangeGray(tmp_img, x - 10, y, -2, 0);
        int right_range_gray = getRangeGray(tmp_img, x + 10, y, 2, 0);

        bool up_condition    = up_range_gray > OK_THREAD_MIN && up_range_gray < OK_THREAD_MAX;
        bool down_condition  = down_range_gray > OK_THREAD_MIN && down_range_gray < OK_THREAD_MAX;
        bool left_condition  = left_range_gray > OK_THREAD_MIN && left_range_gray < OK_THREAD_MAX;
        bool right_condition = right_range_gray > OK_THREAD_MIN && right_range_gray < OK_THREAD_MAX;

        if ((up_condition && !down_condition) || (!up_condition && down_condition) ||
            (left_condition && !right_condition) || (!left_condition && right_condition)) {
          out_img.setPixel(x, y, red);
        }
      }
    }
  }

  out_img.save("out.bmp");
  return 0;
}

int getRangeGray(const BMPImage &img, int x, int y, int dx, int dy) {
  int gray  = 0;
  int count = 0;
  for (int i = -5; i < 5; i++) {
    int new_x = x + i * dx;
    int new_y = y + i * dy;
    if (new_x < 0 || new_x >= img.width() || new_y < 0 || new_y >= img.height()) {
      continue;
    }
    count++;

    gray += img.grayAt(new_x, new_y);
  }
  return count > 0 ? gray / count : 0;
}
