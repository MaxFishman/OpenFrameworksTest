#include "ofApp.h"

void ofApp::setup(){
    ofSetBackgroundColor(12);
    ofEnableAlphaBlending();
    ofSetCircleResolution(24);
    for(int i = 0; i < 300; i++){
        particles.push_back({ {ofRandomWidth(), ofRandomHeight()},
                              {ofRandomf() * 2.0f, ofRandomf() * 2.0f},
                              ofRandom(255) });
    }
}

void ofApp::update(){
    for(auto & p : particles){
        p.pos += p.vel;
        if(p.pos.x < 0 || p.pos.x > ofGetWidth())  p.vel.x *= -1;
        if(p.pos.y < 0 || p.pos.y > ofGetHeight()) p.vel.y *= -1;
    }
}

void ofApp::draw(){
    ofColor c;
    for(auto & p : particles){
        c.setHsb(fmodf(p.hue + ofGetElapsedTimef() * 12.0f, 255), 180, 255);
        ofSetColor(c, 170);
        ofDrawCircle(p.pos.x, p.pos.y, 4);
    }
    ofSetColor(255);
    ofDrawBitmapString("a particle field - click to add more", 20, 30);
}

void ofApp::mousePressed(int x, int y, int button){
    for(int i = 0; i < 24; i++){
        particles.push_back({ {(float)x, (float)y},
                              {ofRandomf() * 3.0f, ofRandomf() * 3.0f},
                              ofRandom(255) });
    }
}
