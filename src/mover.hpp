//
//  mover.hpp
//  F26_CodingArtFundamentals_IntroToOF_Week8
//
//  Created by Luisa Pinzon on 10/19/26.
//

#ifndef mover_hpp
#define mover_hpp

#include "ofMain.h"
#include <stdio.h>

class mover {
public:
	mover();
	int r;
	int g;
	int b;

	float x;
	float y;

	float xDir;
	float yDir;

	float offsetX;
	float offsetY;

	void setup();
	void display(int numShapes, float diam);
	void update();
	void KeepInCanvas();

};

#endif /* mover_hpp */
