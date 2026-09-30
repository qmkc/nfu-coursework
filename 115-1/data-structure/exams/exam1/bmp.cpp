// load() 支援：1/4/8-bit 調色盤(indexed)、24-bit、32-bit，且不壓縮
// (compression == 0)；32-bit 額外允許 compression == 3(BI_BITFIELDS)，
// 但不會真的解析色彩遮罩，直接假設是標準 BGRA 排列。
// Info header 只要求 >= 40 bytes(BITMAPINFOHEADER)；V4/V5 等更大的 header
// 也讀得進來，但超出 40 bytes 的擴充欄位(色彩空間、ICC profile...)一律忽略。
//
// load() 不支援：
//   - RLE4 / RLE8 壓縮(compression == 1 或 2)
//   - 16-bit(555/565) 色深
//   - OS/2 BITMAPCOREHEADER(12-byte 舊式 header)
//   - 32-bit 的 alpha 透明度(Pixel 沒有 alpha 欄位，讀到就丟棄)
//
// save() 不保留原始格式：不管載入時是什麼色深/壓縮，一律輸出成
// 24-bit、不壓縮、bottom-up 的標準 BMP。

#include "bmp.h"

#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <fstream>
#include <iostream>

int BMPImage::width() const {
  return infoHeader.width;
}

int BMPImage::height() const {
  return infoHeader.height;
}

bool BMPImage::load(const std::string &path) {
  std::ifstream in(path, std::ios::binary);
  if (!in) {
    std::cerr << "Cannot open file for reading: " << path << "\n";
    return false;
  }

  in.read(reinterpret_cast<char *>(&fileHeader), sizeof(fileHeader));
  if (!in || fileHeader.signature != 0x4D42) {
    std::cerr << "Not a valid BMP file: " << path << "\n";
    return false;
  }

  uint32_t headerSize = 0;
  in.read(reinterpret_cast<char *>(&headerSize), sizeof(headerSize));
  if (!in || headerSize < sizeof(BMPInfoHeader)) {
    std::cerr << "Unsupported or corrupt BMP info header (size=" << headerSize << ").\n";
    return false;
  }
  std::vector<uint8_t> headerBuf(headerSize);
  std::memcpy(headerBuf.data(), &headerSize, sizeof(headerSize));
  in.read(reinterpret_cast<char *>(headerBuf.data()) + sizeof(headerSize), headerSize - sizeof(headerSize));
  if (!in) {
    std::cerr << "Truncated BMP info header.\n";
    return false;
  }
  std::memcpy(&infoHeader, headerBuf.data(), sizeof(BMPInfoHeader));

  int  bpp           = infoHeader.bitsPerPixel;
  bool bppOk         = (bpp == 1 || bpp == 4 || bpp == 8 || bpp == 24 || bpp == 32);
  bool compressionOk = (infoHeader.compression == 0) || (infoHeader.compression == 3 && bpp == 32);
  if (!bppOk || !compressionOk) {
    std::cerr << "Unsupported BMP variant (bitsPerPixel=" << bpp << ", compression=" << infoHeader.compression
              << "). Supported: 1/4/8-bit palette, 24-bit, 32-bit, uncompressed.\n";
    return false;
  }

  std::vector<Pixel> palette;
  if (bpp <= 8) {
    int numColors = infoHeader.colorsUsed != 0 ? static_cast<int>(infoHeader.colorsUsed) : (1 << bpp);
    palette.resize(numColors);
    for (int i = 0; i < numColors; ++i) {
      uint8_t entry[4];
      in.read(reinterpret_cast<char *>(entry), sizeof(entry));
      if (!in) {
        std::cerr << "Truncated BMP color palette.\n";
        return false;
      }
      palette[i] = Pixel {entry[0], entry[1], entry[2]};
    }
  }

  if (infoHeader.width <= 0 || infoHeader.height == 0) {
    std::cerr << "Invalid BMP dimensions (width=" << infoHeader.width << ", height=" << infoHeader.height << ").\n";
    return false;
  }

  bool flipped   = infoHeader.height > 0;
  int  w         = infoHeader.width;
  int  h         = static_cast<int>(std::abs(static_cast<long long>(infoHeader.height)));
  int  rowPadded = ((bpp * w + 31) / 32) * 4;

  constexpr long long kMaxPixels = 200'000'000LL;
  if (static_cast<long long>(w) * h > kMaxPixels) {
    std::cerr << "BMP dimensions too large (width=" << w << ", height=" << h << ").\n";
    return false;
  }

  pixels.assign(static_cast<size_t>(w) * h, Pixel {});
  std::vector<uint8_t> rowBuf(rowPadded);

  in.seekg(fileHeader.dataOffset, std::ios::beg);
  for (int y = 0; y < h; ++y) {
    in.read(reinterpret_cast<char *>(rowBuf.data()), rowPadded);
    if (!in) {
      std::cerr << "Unexpected end of file while reading pixel data.\n";
      return false;
    }
    int destRow = flipped ? (h - 1 - y) : y;
    for (int x = 0; x < w; ++x) {
      Pixel p;
      switch (bpp) {
        case 32:
          p.b = rowBuf[x * 4 + 0];
          p.g = rowBuf[x * 4 + 1];
          p.r = rowBuf[x * 4 + 2];
          break;
        case 24:
          p.b = rowBuf[x * 3 + 0];
          p.g = rowBuf[x * 3 + 1];
          p.r = rowBuf[x * 3 + 2];
          break;
        case 8: {
          uint8_t index = rowBuf[x];
          p             = index < palette.size() ? palette[index] : Pixel {0, 0, 0};
          break;
        }
        case 4: {
          uint8_t byte  = rowBuf[x / 2];
          uint8_t index = (x % 2 == 0) ? (byte >> 4) : (byte & 0x0F);
          p             = index < palette.size() ? palette[index] : Pixel {0, 0, 0};
          break;
        }
        default: {
          uint8_t byte  = rowBuf[x / 8];
          uint8_t index = (byte >> (7 - (x % 8))) & 0x01;
          p             = index < palette.size() ? palette[index] : Pixel {0, 0, 0};
          break;
        }
      }
      pixels[static_cast<size_t>(destRow) * w + x] = p;
    }
  }

  infoHeader.height = h;
  return true;
}

bool BMPImage::save(const std::string &path) const {
  std::ofstream out(path, std::ios::binary);
  if (!out) {
    std::cerr << "Cannot open file for writing: " << path << "\n";
    return false;
  }

  int      w         = infoHeader.width;
  int      h         = infoHeader.height;
  int      rowPadded = (w * 3 + 3) & (~3);
  uint32_t dataSize  = static_cast<uint32_t>(rowPadded) * h;

  BMPFileHeader fh = fileHeader;
  BMPInfoHeader ih = infoHeader;
  ih.headerSize    = 40;
  ih.width         = w;
  ih.height        = h;
  ih.bitsPerPixel  = 24;
  ih.compression   = 0;
  ih.imageSize     = dataSize;
  fh.dataOffset    = sizeof(BMPFileHeader) + sizeof(BMPInfoHeader);
  fh.fileSize      = fh.dataOffset + dataSize;
  fh.signature     = 0x4D42;  // 'BM'

  out.write(reinterpret_cast<const char *>(&fh), sizeof(fh));
  out.write(reinterpret_cast<const char *>(&ih), sizeof(ih));

  std::vector<uint8_t> rowBuf(rowPadded, 0);
  for (int y = h - 1; y >= 0; --y) {
    for (int x = 0; x < w; ++x) {
      const Pixel &p    = pixels[static_cast<size_t>(y) * w + x];
      rowBuf[x * 3 + 0] = p.b;
      rowBuf[x * 3 + 1] = p.g;
      rowBuf[x * 3 + 2] = p.r;
    }
    out.write(reinterpret_cast<const char *>(rowBuf.data()), rowPadded);
  }
  return true;
}

uint8_t Pixel::gray() const {
  return static_cast<uint8_t>(0.299 * r + 0.587 * g + 0.114 * b);
}

void BMPImage::toGrayscale() {
  for (auto &p : pixels) {
    p.r = p.g = p.b = p.gray();
  }
}

bool BMPImage::inBounds(int x, int y) const {
  return x >= 0 && y >= 0 && x < width() && y < height();
}

Pixel BMPImage::getPixel(int x, int y) const {
  if (!inBounds(x, y)) {
    return Pixel {0, 0, 0};
  }
  return pixels[static_cast<size_t>(y) * width() + x];
}

Pixel &BMPImage::at(int x, int y) {
  return pixels[static_cast<size_t>(y) * width() + x];
}

const Pixel &BMPImage::at(int x, int y) const {
  return pixels[static_cast<size_t>(y) * width() + x];
}

uint8_t BMPImage::luminance(const Pixel &p) {
  return p.gray();
}

int BMPImage::grayAt(int x, int y) const {
  return getPixel(x, y).gray();
}

BMPImage::ColumnRef BMPImage::operator[](int x) {
  return ColumnRef(*this, x);
}

BMPImage::ConstColumnRef BMPImage::operator[](int x) const {
  return ConstColumnRef(*this, x);
}

void BMPImage::setPixel(int x, int y, const Pixel &color) {
  if (x < 0 || y < 0 || x >= width() || y >= height()) {
    return;
  }

  pixels[static_cast<size_t>(y) * width() + x] = color;
}

void BMPImage::fill(const Pixel &color) {
  std::fill(pixels.begin(), pixels.end(), color);
}

void BMPImage::fillRect(int x1, int y1, int x2, int y2, const Pixel &color) {
  if (x1 > x2) {
    std::swap(x1, x2);
  }
  if (y1 > y2) {
    std::swap(y1, y2);
  }

  for (int y = y1; y <= y2; ++y) {
    for (int x = x1; x <= x2; ++x) {
      setPixel(x, y, color);
    }
  }
}

void BMPImage::drawRect(int x1, int y1, int x2, int y2, const Pixel &color, int thickness) {
  if (x1 > x2) {
    std::swap(x1, x2);
  }

  if (y1 > y2) {
    std::swap(y1, y2);
  }

  for (int t = 0; t < thickness; ++t) {
    for (int x = x1; x <= x2; ++x) {
      setPixel(x, y1 - t, color);
      setPixel(x, y2 + t, color);
    }

    for (int y = y1; y <= y2; ++y) {
      setPixel(x1 - t, y, color);
      setPixel(x2 + t, y, color);
    }
  }
}

void BMPImage::drawPoint(int x, int y, const Pixel &color, int radius) {
  for (int dy = -radius; dy <= radius; ++dy) {
    for (int dx = -radius; dx <= radius; ++dx) {
      setPixel(x + dx, y + dy, color);
    }
  }
}

void BMPImage::drawLine(int x1, int y1, int x2, int y2, const Pixel &color, int thickness) {
  // Bresenham's line algorithm
  int dx  = std::abs(x2 - x1);
  int dy  = -std::abs(y2 - y1);
  int sx  = x1 < x2 ? 1 : -1;
  int sy  = y1 < y2 ? 1 : -1;
  int err = dx + dy;

  int x = x1, y = y1;
  while (true) {
    if (thickness <= 1) {
      setPixel(x, y, color);
    } else {
      drawPoint(x, y, color, thickness / 2);
    }

    if (x == x2 && y == y2) {
      break;
    }
    int e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

void BMPImage::invert() {
  for (auto &p : pixels) {
    p.r = 255 - p.r;
    p.g = 255 - p.g;
    p.b = 255 - p.b;
  }
}

void BMPImage::thresholdBelow(int threshold, const Pixel &below) {
  for (auto &p : pixels) {
    if (luminance(p) < threshold) {
      p = below;
    }
  }
}

BMPImage BMPImage::crop(int x1, int y1, int x2, int y2) const {
  if (x1 > x2) {
    std::swap(x1, x2);
  }
  if (y1 > y2) {
    std::swap(y1, y2);
  }
  x1 = std::max(0, x1);
  y1 = std::max(0, y1);
  x2 = std::min(width() - 1, x2);
  y2 = std::min(height() - 1, y2);

  BMPImage out;
  out.fileHeader = fileHeader;
  out.infoHeader = infoHeader;

  int w                 = std::max(0, x2 - x1 + 1);
  int h                 = std::max(0, y2 - y1 + 1);
  out.infoHeader.width  = w;
  out.infoHeader.height = h;
  out.pixels.resize(static_cast<size_t>(w) * h);

  for (int y = 0; y < h; ++y) {
    for (int x = 0; x < w; ++x) {
      out.pixels[static_cast<size_t>(y) * w + x] = getPixel(x1 + x, y1 + y);
    }
  }
  return out;
}

double boxMean(const std::vector<long long> &values, int w, int h, int x, int y, int radius) {
  int x0 = std::max(0, x - radius), x1 = std::min(w - 1, x + radius);
  int y0 = std::max(0, y - radius), y1 = std::min(h - 1, y + radius);

  long long sum   = 0;
  int       count = 0;
  for (int yy = y0; yy <= y1; ++yy) {
    for (int xx = x0; xx <= x1; ++xx) {
      sum += values[static_cast<size_t>(yy) * w + xx];
      ++count;
    }
  }
  return count > 0 ? static_cast<double>(sum) / count : 0.0;
}
