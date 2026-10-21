#pragma once

#include "ofMain.h"
#include "mover.hpp"

class ofApp : public ofBaseApp{

	public:
		void setup() override;
		void draw() override;

		void windowResized(int w, int h) override;
		void keyPressed(int key) override;
		void toggleFullscreen();
	
	ofFbo fbo;
		
	vector <mover> movers;
	vector <float> randShape;
	vector <float> randSize;
	int numMovers;
};
