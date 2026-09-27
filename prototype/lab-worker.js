import { createLabSceneBuilder } from '../src/engine/lab-future.js';

const buildScene = createLabSceneBuilder();

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ key: data.key, ...buildScene(data) });
  } catch (error) {
    self.postMessage({ key: data.key, error: error.message });
  }
};
