CXX      = g++
CXXFLAGS = -std=c++17 -O2 -Wall

.PHONY: all clean

all: exam1 threshold region_threshold teeth_box

exam1: main.cpp bmp.cpp bmp.h
	$(CXX) $(CXXFLAGS) -o $@ main.cpp bmp.cpp

threshold: threshold.cpp bmp.cpp bmp.h
	$(CXX) $(CXXFLAGS) -o $@ threshold.cpp bmp.cpp

region_threshold: region_threshold.cpp bmp.cpp bmp.h
	$(CXX) $(CXXFLAGS) -o $@ region_threshold.cpp bmp.cpp

teeth_box: teeth_box.cpp bmp.cpp bmp.h
	$(CXX) $(CXXFLAGS) -o $@ teeth_box.cpp bmp.cpp

clean:
	rm -f exam1 threshold region_threshold teeth_box
