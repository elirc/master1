export const outboxJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential" as const,
    delay: 5_000
  },
  removeOnComplete: 100,
  removeOnFail: 500
};

export const emailJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 3_000
  },
  removeOnComplete: 100,
  removeOnFail: 500
};
