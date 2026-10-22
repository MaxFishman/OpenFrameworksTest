#pragma once
#include "ofMain.h"
#include "ofxFft.h"
#include <mutex>

class ofApp : public ofBaseApp {
public:
    void setup();
    void update();
    void draw();
    void audioIn(ofSoundBuffer & input);

    ofSoundStream stream;
    ofxFft* fft = nullptr;
    std::vector<float> audio;
    std::vector<float> bins;
    std::mutex mtx;
};
