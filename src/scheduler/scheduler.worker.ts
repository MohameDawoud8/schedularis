import { parentPort, workerData } from 'worker_threads';

const checkInterval = workerData.checkInterval || 1000;

function scheduleNextCheck() {
  setTimeout(() => {
    parentPort.postMessage({ type: 'checkJobs' });
    scheduleNextCheck();
  }, checkInterval);
}

scheduleNextCheck();
