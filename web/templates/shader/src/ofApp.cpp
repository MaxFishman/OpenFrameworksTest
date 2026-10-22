#include "ofApp.h"

void ofApp::setup(){
    shader.load("shader");   // loads bin/data/shader.vert + shader.frag
}

void ofApp::draw(){
    shader.begin();
    shader.setUniform2f("resolution", ofGetWidth(), ofGetHeight());
    shader.setUniform1f("time", ofGetElapsedTimef());
    ofDrawRectangle(0, 0, ofGetWidth(), ofGetHeight());
    shader.end();

    ofSetColor(255);
    ofDrawBitmapString("a fullscreen GLSL shader", 20, 30);
}
