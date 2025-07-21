export type OperationAction = 'create' | 'update' | 'delete';

export type Operation = {
  id: string;
  action: OperationAction;
  payload?: Record<string, any>;
};

export type JobStatus = 'in_progress' | 'completed' | 'failed';
export type Job = Operation & {
  bulkRequestId: string;
};
