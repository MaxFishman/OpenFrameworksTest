#pragma once
#include "ofMain.h"

struct Particle { glm::vec2 pos, vel; float hue; };

class ofApp : public ofBaseApp {
public:
    void setup();
    void update();
    void draw();
    void mousePressed(int x, int y, int button);
    std::vector<Particle> particles;
};
