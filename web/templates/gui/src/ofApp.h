#pragma once
#include "ofMain.h"
#include "ofxGui.h"

class ofApp : public ofBaseApp {
public:
    void setup();
    void draw();
    ofxPanel gui;
    ofParameter<int> count;
    ofParameter<float> radius;
    ofParameter<ofColor> color;
};
