// global.d.ts
interface MRZWorkerResult {
    parsed: {
      valid: boolean;
      fields: Record<string, string>;
    };
  }
  
  interface MRZWorker {
    (data: { image: string }): Promise<MRZWorkerResult>;
  }
  
  interface Window {
    mrz_worker: MRZWorker;
  }
  