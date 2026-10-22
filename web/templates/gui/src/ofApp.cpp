#include "ofApp.h"

void ofApp::setup(){
    ofSetBackgroundColor(18);
    ofSetCircleResolution(60);
    gui.setup("controls");
    gui.add(count.set("count", 8, 1, 40));
    gui.add(radius.set("radius", 120.0f, 10.0f, 320.0f));
    gui.add(color.set("color", ofColor(120, 200, 255), ofColor(0, 0, 0), ofColor(255, 255, 255)));
}

void ofApp::draw(){
    ofPushMatrix();
    ofTranslate(ofGetWidth() * 0.5f, ofGetHeight() * 0.5f);
    ofSetColor(color);
    int n = count;
    for(int i = 0; i < n; i++){
        float a = TWO_PI * i / n;
        ofDrawCircle(cos(a) * radius, sin(a) * radius, 22);
    }
    ofPopMatrix();

    gui.draw();   // drag the sliders to change the pattern
}
