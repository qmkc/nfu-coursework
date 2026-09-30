#include <iostream>
#include <string>

#include "bmp.h"

// Standalone tool: any pixel whose grayscale value falls below the given
// threshold is turned pure black; everything else is left untouched.
//
// Usage: ./threshold [threshold] [inputPath] [outputPath]
//   threshold  0-255, default 85
//   inputPath  default "A1.bmp"
//   outputPath default "A1_threshold.bmp"

int main(int argc, char **argv) {
  int         threshold  = argc >= 2 ? std::stoi(argv[1]) : 85;
  std::string inputPath  = "A1.bmp";
  std::string outputPath = "A1_threshold.bmp";

  if (argc >= 3) inputPath = argv[2];
  if (argc >= 4) outputPath = argv[3];

  BMPImage img;
  if (!img.load(inputPath)) {
    std::cerr << "Failed to load " << inputPath << "\n";
    return 1;
  }

  for (Pixel &p : img.pixels) {
    int gray = static_cast<int>(0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
    if (gray < threshold) {
      p.r = p.g = p.b = 0;
    }
  }

  if (!img.save(outputPath)) {
    std::cerr << "Failed to save " << outputPath << "\n";
    return 1;
  }

  std::cout << "Saved " << outputPath << " (threshold=" << threshold << ")\n";
  return 0;
}
