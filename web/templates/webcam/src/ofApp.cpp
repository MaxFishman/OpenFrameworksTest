#include "ofApp.h"

void ofApp::setup(){
    ofSetBackgroundColor(0);
    cam.setup(640, 480);   // the browser will ask the viewer for camera permission
}

void ofApp::update(){
    cam.update();
}

void ofApp::draw(){
    // draw the webcam mirrored to fill the canvas
    ofPushMatrix();
    ofTranslate(ofGetWidth(), 0);
    ofScale(-1, 1);
    if(cam.isInitialized() && cam.getWidth() > 0){
        cam.draw(0, 0, ofGetWidth(), ofGetHeight());
    }
    ofPopMatrix();

    ofSetColor(255);
    ofDrawBitmapString("webcam (mirrored) - allow camera access", 20, 30);
}
