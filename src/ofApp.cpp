#include "ofApp.h"

#ifdef TARGET_EMSCRIPTEN
#include <emscripten/html5.h>
#endif

//--------------------------------------------------------------
void ofApp::setup(){
	ofBackground(255, 60, 100);
	movers.clear();
	randShape.clear();
	randSize.clear();
	//Fbo object setup
	fbo.allocate(ofGetWidth(), ofGetHeight(), GL_RGBA);

	fbo.begin();
	
	ofClear(255, 60, 100, 255);   // paint the starting background once
	fbo.end();
	
	numMovers = 50;
	
	for(int i = 0; i < numMovers; i++){
		movers.push_back(mover());
		randShape.push_back(ofRandom(2,10));
		randSize.push_back(ofRandom(5,10));
		
	}

}

//--------------------------------------------------------------
void ofApp::draw(){
	
	fbo.begin();
	ofFill();
		ofSetColor(255, 60, 100, 10);
		ofDrawRectangle(0, 0, fbo.getWidth(), fbo.getHeight());

	
	for (int i = 0; i < numMovers; i++)
	{
		movers[i].display(randShape[i],randSize[i]);
		movers[i].update();
		movers[i].KeepInCanvas();
	}
	
	fbo.end();

	ofSetColor(255);   // white, so the FBO draws with its real colors
	
	
	fbo.draw(0, 0);
	

}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){
	
	fbo.allocate(w, h, GL_RGBA);
	fbo.begin();
	ofClear(255, 60, 100, 255);
	fbo.end();

}

void ofApp::keyPressed(int key){
	if(key == 'r'){
		setup();
	}
	if(key == 'f'){
		toggleFullscreen();
	}
}

//--------------------------------------------------------------
void ofApp::toggleFullscreen(){
#ifdef TARGET_EMSCRIPTEN
	// On the web, fullscreen must go through emscripten and has to be requested
	// from within a user gesture (this key event qualifies). We leave the canvas
	// backing size alone and ask the browser to scale it up to fill the screen,
	// so the sketch keeps rendering normally and is simply stretched to fit.
	EmscriptenFullscreenChangeEvent status;
	emscripten_get_fullscreen_status(&status);
	if(status.isFullscreen){
		emscripten_exit_fullscreen();
	}else{
		EmscriptenFullscreenStrategy strategy = {};
		strategy.scaleMode = EMSCRIPTEN_FULLSCREEN_SCALE_STRETCH; // fill the whole screen
		strategy.canvasResolutionScaleMode = EMSCRIPTEN_FULLSCREEN_CANVAS_SCALE_NONE; // keep the render size
		strategy.filteringMode = EMSCRIPTEN_FULLSCREEN_FILTERING_DEFAULT;
		emscripten_request_fullscreen_strategy("#canvas", EM_TRUE, &strategy);
	}
#else
	ofToggleFullscreen();
#endif
}

