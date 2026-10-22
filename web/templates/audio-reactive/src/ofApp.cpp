#include "ofApp.h"

void ofApp::setup(){
    ofSetBackgroundColor(12);
    fft = ofxFft::create(512, OF_FFT_WINDOW_HAMMING);
    audio.assign(512, 0.0f);
    bins.assign(fft->getBinSize(), 0.0f);

    ofSoundStreamSettings settings;
    settings.numInputChannels = 1;     // the browser will ask for microphone permission
    settings.numOutputChannels = 0;
    settings.sampleRate = 44100;
    settings.bufferSize = 512;
    settings.setInListener(this);
    stream.setup(settings);
}

void ofApp::audioIn(ofSoundBuffer & input){
    size_t n = std::min((size_t)512, input.getNumFrames());
    for(size_t i = 0; i < n; i++) audio[i] = input.getSample(i, 0);
    fft->setSignal(audio.data());
    float* amp = fft->getAmplitude();
    std::lock_guard<std::mutex> lock(mtx);
    for(int i = 0; i < fft->getBinSize(); i++) bins[i] = amp[i];
}

void ofApp::update(){}

void ofApp::draw(){
    std::vector<float> b;
    { std::lock_guard<std::mutex> lock(mtx); b = bins; }

    int n = (int)b.size();
    if(n == 0) return;
    float w = (float)ofGetWidth() / n;
    for(int i = 0; i < n; i++){
        float h = ofClamp(b[i] * 4000.0f, 0, ofGetHeight());
        ofColor c; c.setHsb(ofMap(i, 0, n, 120, 255), 200, 255);
        ofSetColor(c);
        ofDrawRectangle(i * w, ofGetHeight() - h, w + 1, h);
    }
    ofSetColor(255);
    ofDrawBitmapString("audio-reactive FFT - allow microphone access", 20, 30);
}
