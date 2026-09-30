#pragma once

#include <cstdint>
#include <string>
#include <vector>

#pragma pack(push, 1)
struct BMPFileHeader {
  uint16_t signature {0x4D42};
  uint32_t fileSize {0};
  uint16_t reserved1 {0};
  uint16_t reserved2 {0};
  uint32_t dataOffset {54};
};

struct BMPInfoHeader {
  uint32_t headerSize {40};
  int32_t  width {0};
  int32_t  height {0};
  uint16_t planes {1};
  uint16_t bitsPerPixel {24};
  uint32_t compression {0};
  uint32_t imageSize {0};
  int32_t  xPixelsPerMeter {2835};
  int32_t  yPixelsPerMeter {2835};
  uint32_t colorsUsed {0};
  uint32_t colorsImportant {0};
};

#pragma pack(pop)
struct Pixel {
  uint8_t b;
  uint8_t g;
  uint8_t r;

  uint8_t gray() const;
};

class BMPImage {
 public:
  BMPFileHeader      fileHeader;
  BMPInfoHeader      infoHeader;
  std::vector<Pixel> pixels;

  int width() const;
  int height() const;

  bool load(const std::string &path);
  bool save(const std::string &path) const;

  void toGrayscale();

  bool         inBounds(int x, int y) const;
  Pixel        getPixel(int x, int y) const;
  Pixel       &at(int x, int y);
  const Pixel &at(int x, int y) const;

  class ColumnRef {
   public:
    ColumnRef(BMPImage &img, int x) : img_(img), x_(x) {}
    Pixel &operator[](int y) const {
      return img_.at(x_, y);
    }

   private:
    BMPImage &img_;
    int       x_;
  };

  class ConstColumnRef {
   public:
    ConstColumnRef(const BMPImage &img, int x) : img_(img), x_(x) {}
    Pixel operator[](int y) const {
      return img_.getPixel(x_, y);
    }

   private:
    const BMPImage &img_;
    int             x_;
  };

  ColumnRef      operator[](int x);
  ConstColumnRef operator[](int x) const;

  static uint8_t luminance(const Pixel &p);
  int            grayAt(int x, int y) const;

  void setPixel(int x, int y, const Pixel &color);
  void fill(const Pixel &color);
  void fillRect(int x1, int y1, int x2, int y2, const Pixel &color);
  void drawRect(int x1, int y1, int x2, int y2, const Pixel &color, int thickness = 1);
  void drawPoint(int x, int y, const Pixel &color, int radius = 2);
  void drawLine(int x1, int y1, int x2, int y2, const Pixel &color, int thickness = 1);

  void invert();
  void thresholdBelow(int threshold, const Pixel &below = Pixel {0, 0, 0});

  BMPImage crop(int x1, int y1, int x2, int y2) const;
};

// 對一張 w x h 的灰階數值網格(例如用 BMPImage::grayAt 逐點取出來的亮度值)，
// 計算 (x, y) 附近 (2*radius+1) x (2*radius+1) 範圍內的平均值；超出邊界的
// 部分會自動被忽略、不計入平均(而不是當成 0)。
//
// 用途：把某個像素跟「它附近的像素」比較，藉此找出局部異常過暗/過亮的點，
// 這是許多影像處理(去雜訊、局部門檻化、瑕疵偵測...)常見的第一步。
//
// 範例：找出比周圍平均暗超過 30 灰階的像素
//
//   BMPImage img;
//   img.load("A1.bmp");
//   int w = img.width(), h = img.height();
//
//   std::vector<long long> gray(static_cast<size_t>(w) * h);
//   for (int y = 0; y < h; ++y) {
//     for (int x = 0; x < w; ++x) {
//       gray[static_cast<size_t>(y) * w + x] = img.grayAt(x, y);
//     }
//   }
//
//   const int radius = 8;
//   for (int y = 0; y < h; ++y) {
//     for (int x = 0; x < w; ++x) {
//       double avg   = boxMean(gray, w, h, x, y, radius);
//       double value = static_cast<double>(gray[static_cast<size_t>(y) * w + x]);
//       if (avg - value >= 30) {
//         // (x, y) 比鄰域暗很多，可能是雜訊、瑕疵或病灶候選點
//       }
//     }
//   }
//
// 注意：這是最直觀的寫法，每個 (x, y) 都重新掃一次鄰域，時間複雜度是
// O(w * h * radius^2)。圖片夠小(像這個 exam 用的 X 光片)跑起來仍然很快；
// 如果圖片很大、radius 也很大，才需要考慮用「積分影像(前綴和)」把每次查詢
// 降到 O(1)。
double boxMean(const std::vector<long long> &values, int w, int h, int x, int y, int radius);
