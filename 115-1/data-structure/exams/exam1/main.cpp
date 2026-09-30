#include "bmp.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <queue>
#include <string>
#include <vector>

namespace {

  struct ROI {
    int x1, y1, x2, y2;
  };

  // 牙齒 X 光片中，牙齒本體通常比周圍軟組織/背景亮，先粗略框出中央亮區。
  ROI detectToothROI(const std::vector<long long> &gray, int w, int h) {
    int sx1 = static_cast<int>(w * 0.10);
    int sx2 = static_cast<int>(w * 0.90);
    int sy1 = static_cast<int>(h * 0.15);
    int sy2 = static_cast<int>(h * 0.85);

    int minX = sx2, minY = sy2, maxX = sx1, maxY = sy1;

    const int threshold = 150;
    for (int y = sy1; y < sy2; ++y) {
      for (int x = sx1; x < sx2; ++x) {
        if (gray[static_cast<size_t>(y) * w + x] >= threshold) {
          minX = std::min(minX, x);
          maxX = std::max(maxX, x);
          minY = std::min(minY, y);
          maxY = std::max(maxY, y);
        }
      }
    }

    int mx = static_cast<int>(w * 0.02);
    int my = static_cast<int>(h * 0.04);
    minX   = std::max(0, minX - mx);
    minY   = std::max(0, minY - my);
    maxX   = std::min(w - 1, maxX + mx);
    maxY   = std::min(h - 1, maxY + my);
    return {minX, minY, maxX, maxY};
  }

  struct AnomalyRegion {
    int x1, y1, x2, y2;
    int pixelCount;
  };

  // 對 ROI 內每個像素，把它「附近的 pixel」平均起來當作該處的正常亮度基準，
  // 再看原始像素比這個附近平均暗多少：只要暗超過一個固定的臨界值
  // (dropThreshold)，就標記為異常暗點。再用 BFS 把相鄰的標記像素群聚成
  // 一塊塊「異常區域」，太小的視為雜訊濾掉。
  std::vector<AnomalyRegion> findAnomalies(const std::vector<long long> &gray,
                                           int                           w,
                                           int                           h,
                                           const ROI                    &roi,
                                           int                           radius,
                                           int                           dropThreshold,
                                           int                           minRegionSize) {
    std::vector<uint8_t> flagged(gray.size(), 0);
    for (int y = roi.y1; y <= roi.y2; ++y) {
      for (int x = roi.x1; x <= roi.x2; ++x) {
        size_t idx = static_cast<size_t>(y) * w + x;

        double neighborhoodAvg = boxMean(gray, w, h, x, y, radius);
        double value           = static_cast<double>(gray[idx]);
        if (neighborhoodAvg - value >= dropThreshold) {
          flagged[idx] = 1;
        }
      }
    }

    // BFS 連通分量：把相鄰的異常像素合併成同一塊區域。
    std::vector<uint8_t>       visited(gray.size(), 0);
    std::vector<AnomalyRegion> regions;
    const int                  dx[4] = {1, -1, 0, 0};
    const int                  dy[4] = {0, 0, 1, -1};

    for (int y = roi.y1; y <= roi.y2; ++y) {
      for (int x = roi.x1; x <= roi.x2; ++x) {
        size_t idx = static_cast<size_t>(y) * w + x;
        if (!flagged[idx] || visited[idx]) continue;

        std::queue<std::pair<int, int>> q;
        q.push({x, y});
        visited[idx] = 1;

        int minRX = x, minRY = y, maxRX = x, maxRY = y, count = 0;
        while (!q.empty()) {
          auto [cx, cy] = q.front();
          q.pop();
          ++count;
          minRX = std::min(minRX, cx);
          maxRX = std::max(maxRX, cx);
          minRY = std::min(minRY, cy);
          maxRY = std::max(maxRY, cy);

          for (int d = 0; d < 4; ++d) {
            int nx = cx + dx[d];
            int ny = cy + dy[d];
            if (nx < roi.x1 || nx > roi.x2 || ny < roi.y1 || ny > roi.y2) continue;
            size_t nidx = static_cast<size_t>(ny) * w + nx;
            if (!flagged[nidx] || visited[nidx]) continue;
            visited[nidx] = 1;
            q.push({nx, ny});
          }
        }

        if (count < minRegionSize) continue;
        regions.push_back({minRX, minRY, maxRX, maxRY, count});
      }
    }

    return regions;
  }

}  // namespace

int main(int argc, char **argv) {
  std::string input = argc > 1 ? argv[1] : "A1.bmp";

  std::string output = argc > 2 ? argv[2] : "tooth_roi.bmp";

  BMPImage image;

  if (!image.load(input)) {
    return 1;
  }

  std::cout << "Image: " << image.width() << "x" << image.height() << '\n';

  const int w = image.width();
  const int h = image.height();

  std::vector<long long> gray(static_cast<size_t>(w) * h);
  for (int y = 0; y < h; ++y) {
    for (int x = 0; x < w; ++x) {
      gray[static_cast<size_t>(y) * w + x] = image.grayAt(x, y);
    }
  }

  ROI roi = detectToothROI(gray, w, h);
  std::cout << "Tooth ROI: (" << roi.x1 << "," << roi.y1 << ") -> (" << roi.x2 << "," << roi.y2 << ")\n";

  constexpr int kRadius        = 12;  // 附近像素的平均範圍(半徑)
  constexpr int kDropThreshold = 60;  // 比附近平均暗多少灰階算異常
  constexpr int kMinRegionSize = 25;  // 小於這個像素數視為雜訊，不是真的病灶

  std::vector<AnomalyRegion> anomalies = findAnomalies(gray, w, h, roi, kRadius, kDropThreshold, kMinRegionSize);

  std::cout << "Detected " << anomalies.size()
            << " suspicious region(s) (heuristic local-contrast candidates, NOT a diagnosis):\n";
  for (size_t i = 0; i < anomalies.size(); ++i) {
    const AnomalyRegion &r = anomalies[i];
    std::cout << "  #" << i + 1 << ": (" << r.x1 << "," << r.y1 << ") -> (" << r.x2 << "," << r.y2 << ")"
              << "  size=" << r.pixelCount << " px\n";
  }

  const Pixel roiColor     = {255, 0, 0};  // 藍色框出牙齒 ROI
  const Pixel anomalyColor = {0, 0, 255};  // 紅色標出可疑的蛀牙/骨質流失區域

  image.drawRect(roi.x1, roi.y1, roi.x2, roi.y2, roiColor, 2);
  for (const AnomalyRegion &r : anomalies) {
    const int pad = 4;
    image.drawRect(std::max(roi.x1, r.x1 - pad),
                   std::max(roi.y1, r.y1 - pad),
                   std::min(roi.x2, r.x2 + pad),
                   std::min(roi.y2, r.y2 + pad),
                   anomalyColor,
                   2);
  }

  if (!image.save(output)) {
    return 1;
  }
  std::cout << "Saved " << output << '\n';

  return 0;
}
