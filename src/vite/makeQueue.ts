export const makeQueue = () => {
  let queueCount = 0;
  let queue = Promise.resolve();

  return {
    add: (prom: () => Promise<any>) => {
      queueCount += 1;
      return queue.then(async () => {
        try {
          await prom();
        } catch (e) {
          console.error(e);
        }

        queueCount -= 1;
        if (queueCount <= 0) {
          queue = Promise.resolve();
        }
      });
    },
  };
};
