#pragma once
#include "ofMain.h"
#include "ofxBox2d.h"
class ofApp : public ofBaseApp {
public:
    void setup();
    void update();
    void draw();
    void mousePressed(int x, int y, int button);
    ofxBox2d box2d;
    std::vector<std::shared_ptr<ofxBox2dCircle>> circles;
};
