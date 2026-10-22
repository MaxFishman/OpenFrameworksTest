#include "ofApp.h"
void ofApp::setup(){
    ofSetBackgroundColor(18);
    ofSetCircleResolution(40);
    box2d.init();
    box2d.setGravity(0, 12);
    box2d.createBounds();
    box2d.setFPS(60);
    for(int i = 0; i < 16; i++){
        auto c = std::make_shared<ofxBox2dCircle>();
        c->setPhysics(1.0, 0.53, 0.1);
        c->setup(box2d.getWorld(), ofRandomWidth(), ofRandom(0, 200), ofRandom(10, 30));
        circles.push_back(c);
    }
}
void ofApp::update(){ box2d.update(); }
void ofApp::draw(){
    for(auto & c : circles){
        ofSetColor(120, 200, 255);
        c->draw();
    }
    ofSetColor(255);
    ofDrawBitmapString("click to drop a circle", 20, 30);
}
void ofApp::mousePressed(int x, int y, int button){
    auto c = std::make_shared<ofxBox2dCircle>();
    c->setPhysics(1.0, 0.53, 0.1);
    c->setup(box2d.getWorld(), x, y, ofRandom(10, 30));
    circles.push_back(c);
}
