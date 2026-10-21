//
//  mover.cpp
//  F26_CodingArtFundamentals_IntroToOF_Week8
//
//  Created by Luisa Pinzon on 10/19/26.
//

#include "mover.hpp"
mover::mover() {
	
	r = floor(ofRandom(0,100));
	g = floor(ofRandom(200,255));
	b = floor(ofRandom(0,255));
	
	x = ofRandom(ofGetWidth());
	y = ofRandom(ofGetHeight());
	
	xDir = ofRandom(-1,1);
	yDir = ofRandom(-1,1);
	
	offsetX = ofRandom(-5,5);
	offsetY = ofRandom(-5,5);
	
}

//--------------------------------------------------------------
void mover::display(int numShapes, float diam){
	
	for (int i = numShapes; i > 0; i--){
		
		// Circle filled with RGB
		ofFill();
		ofSetColor(r,g,b);
		ofDrawCircle(x+offsetX*i,y+offsetY*i,diam*i);
		
		//Circled without filling just to get the color of the line
		ofNoFill();
		ofSetColor(ofColor::yellow);
		ofDrawCircle(x+offsetX*i,y+offsetY*i,diam*i);
		
	}
	
}
void mover :: update(){
	
	x += xDir;
	y += yDir;
}

void mover::KeepInCanvas(){
	
	if((x > ofGetWidth())||(x < 0)){
		
		xDir = -xDir;
	}
	if((y > ofGetHeight())||(y < 0)){
		
		yDir = -yDir;
	}
}

