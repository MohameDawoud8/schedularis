import { parentPort } from 'worker_threads';

function log(message) {
  parentPort.postMessage({ type: 'log', data: message });
}

class EmailJob {
  async execute(data) {
    log(`Sending email: ${data.subject}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    log(`Email sent: ${data.subject}`);
    return { success: true, message: 'Email sent successfully' };
  }
}

class ProcessingJob {
  async execute(data) {
    log(`Processing data: ${data.dataId}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    log(`Data processed: ${data.dataId}`);
    return { success: true, message: 'Data processed successfully' };
  }
}

parentPort.on('message', async (message) => {
  if (message === 'shutdown') {
    parentPort.close();
    return;
  }

  const { jobType, jobData } = message;
  let result;

  try {
    switch (jobType) {
      case 'email':
        const emailJob = new EmailJob();
        result = await emailJob.execute(jobData);
        break;
      case 'processing':
        const processingJob = new ProcessingJob();
        result = await processingJob.execute(jobData);
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
    parentPort.postMessage({ type: 'result', data: result });
  } catch (error) {
    parentPort.postMessage({
      type: 'result',
      data: { success: false, error: error.message },
    });
  }
});

parentPort.postMessage({ type: 'log', data: 'Worker ready' });
