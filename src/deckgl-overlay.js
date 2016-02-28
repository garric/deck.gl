// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* global window */
import React, {PropTypes} from 'react';
import autobind from 'autobind-decorator';

import WebGLRenderer from './webgl-renderer';
import flatWorld from './flat-world';
import {matchLayers, updateOldLayers, initializeNewLayers, layersNeedRedraw}
  from './layers/layer-manager';

const PROP_TYPES = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  layers: PropTypes.array.isRequired
};

export default class DeckGLOverlay extends React.Component {

  static get propTypes() {
    return PROP_TYPES;
  }

  constructor(props) {
    super(props);
    this.state = {};
    this.needsRedraw = true;
  }

  componentWillReceiveProps(nextProps) {
    matchLayers(this.props.layers, nextProps.layers);
    updateOldLayers(nextProps.layers);
    this.initializeLayers(nextProps.layers);
  }

  initializeLayers(layers) {
    const {gl} = this.state;
    if (!gl) {
      return;
    }
    initializeNewLayers(layers, {gl});
    this.addLayersToScene(layers);
  }

  addLayersToScene(layers) {
    const {scene} = this.state;
    if (!scene) {
      return;
    }
    // clear scene and repopulate based on new layers
    scene.removeAll();
    for (const layer of layers) {
      // Save layer on model for picking purposes
      // TODO - store on model.userData rather than directly on model
      layer.state.model.layer = layer;
      // Add model to scene
      scene.add(layer.state.model);
    }
  }

  @autobind
  _onRendererInitialized({gl, scene}) {
    this.setState({gl, scene});
    initializeNewLayers(this.props.layers, {gl});
  }

  // Route events to layers
  @autobind
  _onClick(info) {
    const {picked} = info;
    for (const item of picked) {
      if (item.model.layer.onClick({color: item.color, ...info})) {
        return;
      }
    }
  }

    // Route events to layers
  @autobind
  _onMouseMove(info) {
    const {picked} = info;
    for (const item of picked) {
      if (item.model.layer.onHover({color: item.color, ...info})) {
        return;
      }
    }
  }

  @autobind
  _checkIfNeedRedraw() {
    const {layers} = this.props;
    return layersNeedRedraw(layers, {clearFlag: true});
  }

  // @autobind
  // onAfterRender

  render() {
    const {width, height, layers, ...otherProps} = this.props;

    // if (layers.length === 0) {
    //   return null;
    // }

    this.initializeLayers(layers);

    return (
      <WebGLRenderer
        { ...otherProps }

        width={ width }
        height={ height }

        viewport={ new flatWorld.Viewport(width, height) }
        camera={ flatWorld.getCamera() }
        lights={ flatWorld.getLighting() }
        blending={ flatWorld.getBlending() }
        pixelRatio={ flatWorld.getPixelRatio(window.devicePixelRatio) }

        onRendererInitialized={ this._onRendererInitialized }
        onNeedRedraw={ this._checkIfNeedRedraw }
        onMouseMove={ this._onMouseMove }
        onClick={ this._onClick }/>
    );
  }

}