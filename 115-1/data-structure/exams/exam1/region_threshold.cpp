#include <algorithm>
#include <array>
#include <cmath>
#include <iostream>
#include <string>
#include <vector>

#include "bmp.h"

namespace {
  struct Integral {
    int                    w = 0, h = 0;
    std::vector<long long> sum;

    void build(const std::vector<long long> &values, int width, int height) {
      w = width;
      h = height;
      sum.assign(static_cast<size_t>(w + 1) * (h + 1), 0);
      for (int y = 0; y < h; ++y) {
        for (int x = 0; x < w; ++x) {
          long long v                                         = values[static_cast<size_t>(y) * w + x];
          sum[static_cast<size_t>(y + 1) * (w + 1) + (x + 1)] = v + sum[static_cast<size_t>(y) * (w + 1) + (x + 1)] +
                                                                sum[static_cast<size_t>(y + 1) * (w + 1) + x] -
                                                                sum[static_cast<size_t>(y) * (w + 1) + x];
        }
      }
    }

    long long boxSum(int x0, int y0, int x1, int y1) const {
      x0 = std::max(0, x0);
      y0 = std::max(0, y0);
      x1 = std::min(w - 1, x1);
      y1 = std::min(h - 1, y1);
      if (x1 < x0 || y1 < y0) return 0;
      return sum[static_cast<size_t>(y1 + 1) * (w + 1) + (x1 + 1)] - sum[static_cast<size_t>(y0) * (w + 1) + (x1 + 1)] -
             sum[static_cast<size_t>(y1 + 1) * (w + 1) + x0] + sum[static_cast<size_t>(y0) * (w + 1) + x0];
    }

    int boxCount(int x0, int y0, int x1, int y1) const {
      x0 = std::max(0, x0);
      y0 = std::max(0, y0);
      x1 = std::min(w - 1, x1);
      y1 = std::min(h - 1, y1);
      if (x1 < x0 || y1 < y0) return 0;
      return (x1 - x0 + 1) * (y1 - y0 + 1);
    }

    double boxMean(int x, int y, int radius) const {
      return static_cast<double>(boxSum(x - radius, y - radius, x + radius, y + radius)) /
             boxCount(x - radius, y - radius, x + radius, y + radius);
    }
  };

  std::vector<double> boxBlur1D(const std::vector<double> &in, int radius, int passes) {
    std::vector<double> cur = in;
    int                 n   = static_cast<int>(in.size());
    for (int p = 0; p < passes; ++p) {
      std::vector<double> next(n);
      double              windowSum = 0;
      for (int i = -radius; i <= radius; ++i) windowSum += cur[std::clamp(i, 0, n - 1)];
      for (int i = 0; i < n; ++i) {
        next[i]    = windowSum / (2 * radius + 1);
        int outIdx = std::clamp(i - radius, 0, n - 1);
        int inIdx  = std::clamp(i + radius + 1, 0, n - 1);
        windowSum += cur[inIdx] - cur[outIdx];
      }
      cur.swap(next);
    }
    return cur;
  }

  std::vector<double> peakProminence(const std::vector<double> &v) {
    int                 n = static_cast<int>(v.size());
    std::vector<double> prominence(n, 0.0);
    if (n == 0) return prominence;

    std::vector<int> order(n);
    for (int i = 0; i < n; ++i) order[i] = i;
    std::sort(order.begin(), order.end(), [&](int a, int b) { return v[a] > v[b]; });

    std::vector<int> parent(n, -1), peakOf(n, -1);
    auto             find = [&](int x) {
      while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x         = parent[x];
      }
      return x;
    };

    for (int idx : order) {
      parent[idx] = idx;
      peakOf[idx] = idx;
      for (int nb : {idx - 1, idx + 1}) {
        if (nb < 0 || nb >= n || parent[nb] == -1) continue;
        int rootN = find(nb);
        int rootI = find(idx);
        if (rootN == rootI) continue;
        int peakN = peakOf[rootN], peakI = peakOf[rootI];
        if (v[peakN] > v[peakI]) {
          prominence[peakI] = v[peakI] - v[idx];
          parent[rootI]     = rootN;
        } else {
          prominence[peakN] = v[peakN] - v[idx];
          parent[rootN]     = rootI;
          peakOf[rootI]     = peakI;
        }
      }
    }

    int topIdx               = order[0];
    int root                 = find(topIdx);
    prominence[peakOf[root]] = v[peakOf[root]] - *std::min_element(v.begin(), v.end());
    return prominence;
  }

  int significantPeakCount(const std::vector<double> &row, double minProminence) {
    std::vector<double> prom = peakProminence(row);
    return static_cast<int>(std::count_if(prom.begin(), prom.end(), [&](double p) { return p >= minProminence; }));
  }

  std::pair<int, int> widestRun(const std::vector<double> &profile, double thresholdRatio, int gapMerge) {
    int n = static_cast<int>(profile.size());
    if (n == 0) return {0, 0};
    double maxV = *std::max_element(profile.begin(), profile.end());
    double thr  = thresholdRatio * maxV;

    std::vector<std::array<int, 2>> runs;
    int                             i = 0;
    while (i < n) {
      if (profile[i] > thr) {
        int j = i;
        while (j < n && profile[j] > thr) ++j;
        runs.push_back({i, j - 1});
        i = j;
      } else {
        ++i;
      }
    }
    if (runs.empty()) return {0, n - 1};

    std::vector<std::array<int, 2>> merged = {runs[0]};
    for (size_t k = 1; k < runs.size(); ++k) {
      if (runs[k][0] - merged.back()[1] <= gapMerge) {
        merged.back()[1] = runs[k][1];
      } else {
        merged.push_back(runs[k]);
      }
    }
    auto best =
        std::max_element(merged.begin(), merged.end(), [](const std::array<int, 2> &a, const std::array<int, 2> &b) {
          return (a[1] - a[0]) < (b[1] - b[0]);
        });
    return {(*best)[0], (*best)[1]};
  }

}  // namespace

int main(int argc, char **argv) {
  std::string inputPath  = argc >= 2 ? argv[1] : "A1.bmp";
  std::string outputPath = argc >= 3 ? argv[2] : "A1_region.bmp";

  constexpr int    kClipMax      = 190;
  constexpr int    kSmoothRadius = 3, kSmoothPasses = 3;
  constexpr double kProminence   = 6.0;
  constexpr double kYRelThresh   = 0.6;
  constexpr int    kYGapMerge    = 30;
  constexpr int    kTexRadius    = 10;
  constexpr double kTexRelThresh = 0.3;
  constexpr double kXRelThresh   = 0.08;
  constexpr int    kXGapMerge    = 20;
  constexpr int    kRoiPad       = 15;
  constexpr int    kAdaptRadius  = 14;
  constexpr int    kAdaptBias    = 4;

  BMPImage img;
  if (!img.load(inputPath)) {
    std::cerr << "Failed to load " << inputPath << "\n";
    return 1;
  }

  const int w = img.width();
  const int h = img.height();

  std::vector<long long> gray(static_cast<size_t>(w) * h);
  for (int y = 0; y < h; ++y) {
    for (int x = 0; x < w; ++x) {
      const Pixel &p                       = img.pixels[static_cast<size_t>(y) * w + x];
      gray[static_cast<size_t>(y) * w + x] = static_cast<long long>(0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
    }
  }
  std::vector<double> clipped(gray.size());
  for (size_t i = 0; i < gray.size(); ++i) clipped[i] = std::min<long long>(gray[i], kClipMax);

  std::vector<double> rowPeaks(h);
  for (int y = 0; y < h; ++y) {
    std::vector<double> row(clipped.begin() + static_cast<size_t>(y) * w,
                            clipped.begin() + static_cast<size_t>(y + 1) * w);
    row         = boxBlur1D(row, kSmoothRadius, kSmoothPasses);
    rowPeaks[y] = significantPeakCount(row, kProminence);
  }
  rowPeaks              = boxBlur1D(rowPeaks, 4, 1);
  auto [yBand0, yBand1] = widestRun(rowPeaks, kYRelThresh, kYGapMerge);
  std::cout << "Tooth row band: " << yBand0 << " - " << yBand1 << "\n";

  std::vector<long long> clippedLL(clipped.begin(), clipped.end());
  std::vector<long long> clippedSqLL(clipped.size());
  for (size_t i = 0; i < clipped.size(); ++i) clippedSqLL[i] = static_cast<long long>(clipped[i] * clipped[i]);
  Integral clipSumI, clipSqI;
  clipSumI.build(clippedLL, w, h);
  clipSqI.build(clippedSqLL, w, h);

  std::vector<double> texture(static_cast<size_t>(w) * (yBand1 - yBand0 + 1));
  double              maxTexture = 0.0;
  for (int y = yBand0; y <= yBand1; ++y) {
    for (int x = 0; x < w; ++x) {
      double mean                                      = clipSumI.boxMean(x, y, kTexRadius);
      double meanSq                                    = clipSqI.boxMean(x, y, kTexRadius);
      double std                                       = std::sqrt(std::max(0.0, meanSq - mean * mean));
      texture[static_cast<size_t>(y - yBand0) * w + x] = std;
      maxTexture                                       = std::max(maxTexture, std);
    }
  }
  double texThresh = kTexRelThresh * maxTexture;

  std::vector<double> colDensity(w, 0.0);
  for (int y = yBand0; y <= yBand1; ++y) {
    for (int x = 0; x < w; ++x) {
      if (texture[static_cast<size_t>(y - yBand0) * w + x] > texThresh) colDensity[x] += 1.0;
    }
  }
  colDensity            = boxBlur1D(colDensity, 7, 1);
  auto [xBand0, xBand1] = widestRun(colDensity, kXRelThresh, kXGapMerge);
  std::cout << "Tooth column band: " << xBand0 << " - " << xBand1 << "\n";

  int roiX0 = std::max(0, xBand0 - kRoiPad);
  int roiX1 = std::min(w - 1, xBand1 + kRoiPad);
  int roiY0 = std::max(0, yBand0 - kRoiPad);
  int roiY1 = std::min(h - 1, yBand1 + kRoiPad);
  std::cout << "Detected tooth region: (" << roiX0 << "," << roiY0 << ") - (" << roiX1 << "," << roiY1 << ")\n";

  Integral graySumI;
  graySumI.build(gray, w, h);

  for (int y = 0; y < h; ++y) {
    for (int x = 0; x < w; ++x) {
      size_t idx       = static_cast<size_t>(y) * w + x;
      bool   insideRoi = (x >= roiX0 && x <= roiX1 && y >= roiY0 && y <= roiY1);
      bool   isForeground =
          insideRoi && static_cast<double>(gray[idx]) > graySumI.boxMean(x, y, kAdaptRadius) + kAdaptBias;
      if (!isForeground) img.pixels[idx] = Pixel {0, 0, 0};
    }
  }

  if (!img.save(outputPath)) {
    std::cerr << "Failed to save " << outputPath << "\n";
    return 1;
  }
  std::cout << "Saved " << outputPath << "\n";
  return 0;
}
